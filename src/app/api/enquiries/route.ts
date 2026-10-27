import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic="force-dynamic";
export async function POST(request:NextRequest){
  const origin=request.headers.get("origin");
  try{if(!origin||new URL(origin).host!==request.headers.get("host"))return NextResponse.json({error:"Request origin is not allowed."},{status:403});}catch{return NextResponse.json({error:"Request origin is not allowed."},{status:403});}
  const length=Number(request.headers.get("content-length")||0);if(length>8192)return NextResponse.json({error:"Enquiry is too large."},{status:413});
  try{
    const body=await request.json();
    if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Please submit a valid enquiry."},{status:400});
    if(typeof body.company==="string"&&body.company.trim())return NextResponse.json({ok:true});
    const name=typeof body.name==="string"?body.name.trim():"",phone=typeof body.phone==="string"?body.phone.trim():"",email=typeof body.email==="string"?body.email.trim():"",message=typeof body.message==="string"?body.message.trim():"",slug=typeof body.propertySlug==="string"?body.propertySlug.trim():"";
    if(name.length<2||name.length>120||phone.length<7||phone.length>32||!/^\+?[0-9 ()-]+$/.test(phone)||email.length>254||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))||message.length<2||message.length>4000)return NextResponse.json({error:"Check your name, phone, email and message."},{status:400});
    const phoneDigits=phone.replace(/\D/g,"");
    if(phoneDigits.length<7||phoneDigits.length>15)return NextResponse.json({error:"Check your phone number."},{status:400});
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key)return NextResponse.json({error:"Enquiry service is not configured. Please contact us on WhatsApp."},{status:503});
    const supabase=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:allowed,error:limitError}=await supabase.rpc("enquiry_allowed",{p_phone:phoneDigits});
    if(limitError){console.error("Enquiry throttle check failed",limitError.code);return NextResponse.json({error:"The enquiry service is temporarily unavailable. Please try WhatsApp."},{status:503});}
    if(allowed!==true)return NextResponse.json({error:"Please wait a few minutes before sending another enquiry."},{status:429});
    let propertyId:string|null=null;
    if(slug){const {data:property,error}=await supabase.from("properties").select("id").eq("slug",slug).eq("publication_status","published").in("availability_status",["available","under_offer"]).maybeSingle();if(error||!property)return NextResponse.json({error:"That property is no longer available."},{status:400});propertyId=property.id;}
    const {error}=await supabase.from("enquiries").insert({property_id:propertyId,customer_name:name,phone,email:email||null,message,status:"new"});
    if(error){console.error("Enquiry insert failed",error.code);return NextResponse.json({error:"We could not save your enquiry. Please try WhatsApp."},{status:503});}
    return NextResponse.json({ok:true},{status:201,headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Please submit a valid enquiry."},{status:400});}
}
