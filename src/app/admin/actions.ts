"use server";

import { redirect } from "next/navigation";
import { createClient, requireAdmin } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect("/admin/login?error=Check%20your%20email%20and%20password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=Sign-in%20failed");
  const { data: allowed, error: roleError } = await supabase.rpc("is_jeshurun_admin");
  if (roleError || allowed !== true) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=This%20account%20is%20not%20authorised");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function createProperty(formData: FormData) {
  const { supabase, userId, isAdmin } = await requireAdmin();
  if (!isAdmin || !userId) redirect("/admin/login");
  const title = String(formData.get("title") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const type = String(formData.get("property_type") ?? "");
  const listing = String(formData.get("listing_type") ?? "");
  const price = Number(formData.get("price"));
  const bedroomsRaw=String(formData.get("bedrooms")??""),bathroomsRaw=String(formData.get("bathrooms")??""),landAreaRaw=String(formData.get("land_area")??""),floorAreaRaw=String(formData.get("floor_area")??"");
  const numberOrEmpty=(value:string)=>value===""||Number.isFinite(Number(value))&&Number(value)>=0;
  if (title.length < 4 || title.length > 140 || location.length < 2 || location.length > 140 || !["house","apartment","townhouse","land","commercial","other"].includes(type) || !["sale","rent"].includes(listing) || !Number.isFinite(price) || price < 0 || (bedroomsRaw!==""&&(!Number.isInteger(Number(bedroomsRaw))||Number(bedroomsRaw)<0)) || !numberOrEmpty(bathroomsRaw)||!numberOrEmpty(landAreaRaw)||!numberOrEmpty(floorAreaRaw)) redirect("/admin?error=Please%20check%20the%20listing%20fields");
  const splitList=(value:FormDataEntryValue|null)=>String(value??"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,40);
  const slug = `${title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
  const { error } = await supabase.from("properties").insert({
    reference: `JD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, slug, title,
    description: String(formData.get("description") ?? "").trim().slice(0, 4000),
    location_name: location,county:String(formData.get("county")??"").trim()||null,area_name:String(formData.get("area_name")??"").trim()||null,listing_type: listing, property_type: type, price,
    bedrooms:bedroomsRaw===""?null:Number(bedroomsRaw),bathrooms:bathroomsRaw===""?null:Number(bathroomsRaw),land_area:landAreaRaw===""?null:Number(landAreaRaw),floor_area:floorAreaRaw===""?null:Number(floorAreaRaw),area_unit:String(formData.get("area_unit")??"").trim()||null,features:splitList(formData.get("features")),amenities:splitList(formData.get("amenities")),featured:formData.get("featured")==="on",
    publication_status: "draft", availability_status: "available", created_by: userId, updated_by: userId,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.code === "23505" ? "Reference conflict. Try again." : "Could not save listing.")}`);
  redirect("/admin?saved=Draft%20saved");
}

export async function updatePublication(formData: FormData) {
  const { supabase, userId, isAdmin } = await requireAdmin();
  if (!isAdmin || !userId) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("publication_status") ?? "");
  const availability = String(formData.get("availability_status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["draft","published","unpublished"].includes(status) || !["available","under_offer","sold","rented"].includes(availability)) redirect("/admin?error=Invalid%20listing%20action");
  if(status==="published"&&["available","under_offer"].includes(availability)){
    const [{data:property},{count:photoCount}]=await Promise.all([
      supabase.from("properties").select("title,price,location_name,description").eq("id",id).maybeSingle(),
      supabase.from("property_images").select("id",{count:"exact",head:true}).eq("property_id",id),
    ]);
    if(!property)redirect("/admin?error=Listing%20not%20found");
    if(!property.title.trim()||!property.location_name.trim()||Number(property.price)<1||property.description.trim().length<20)redirect("/admin?error=Add%20a%20description%20and%20confirm%20the%20listing%20details%20before%20publishing");
    if(!photoCount)redirect("/admin?error=Upload%20at%20least%20one%20property%20photo%20before%20publishing");
  }
  const { error } = await supabase.from("properties").update({ publication_status: status, availability_status: availability, published_at: status === "published" ? new Date().toISOString() : null, updated_by: userId, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect("/admin?error=Could%20not%20update%20listing");
  redirect("/admin?saved=Listing%20updated");
}

export async function updateEnquiryStatus(formData: FormData) {
  const { supabase, isAdmin } = await requireAdmin();
  if (!isAdmin) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["new","contacted","viewing_scheduled","closed"].includes(status)) redirect("/admin?error=Invalid%20enquiry%20action");
  const { error } = await supabase.from("enquiries").update({ status }).eq("id", id);
  if (error) redirect("/admin?error=Could%20not%20update%20enquiry");
  redirect("/admin?saved=Enquiry%20updated");
}

export async function updateProperty(formData: FormData) {
  const { supabase, userId, isAdmin } = await requireAdmin();
  if (!isAdmin || !userId) redirect("/admin/login");
  const id=String(formData.get("id")??""),title=String(formData.get("title")??"").trim(),location=String(formData.get("location")??"").trim(),description=String(formData.get("description")??"").trim(),price=Number(formData.get("price"));
  const bedroomsRaw=String(formData.get("bedrooms")??""),bathroomsRaw=String(formData.get("bathrooms")??"");
  const type=String(formData.get("property_type")??""),listing=String(formData.get("listing_type")??""),landAreaRaw=String(formData.get("land_area")??""),floorAreaRaw=String(formData.get("floor_area")??"");
  const validOptional=(v:string)=>v===""||Number.isFinite(Number(v))&&Number(v)>=0;
  const splitList=(value:FormDataEntryValue|null)=>String(value??"").split(/[\n,]/).map(x=>x.trim()).filter(Boolean).slice(0,40);
  if(!/^[0-9a-f-]{36}$/i.test(id)||title.length<4||title.length>140||location.length<2||location.length>140||description.length>4000||!Number.isFinite(price)||price<0||!(["house","apartment","townhouse","land","commercial","other"].includes(type))||!(["sale","rent"].includes(listing))||(bedroomsRaw!==""&&(!Number.isInteger(Number(bedroomsRaw))||Number(bedroomsRaw)<0))||!validOptional(bathroomsRaw)||!validOptional(landAreaRaw)||!validOptional(floorAreaRaw)) redirect("/admin?error=Please%20check%20the%20listing%20fields");
  const {error}=await supabase.from("properties").update({title,location_name:location,county:String(formData.get("county")??"").trim()||null,area_name:String(formData.get("area_name")??"").trim()||null,description,price,property_type:type,listing_type:listing,bedrooms:bedroomsRaw===""?null:Number(bedroomsRaw),bathrooms:bathroomsRaw===""?null:Number(bathroomsRaw),land_area:landAreaRaw===""?null:Number(landAreaRaw),floor_area:floorAreaRaw===""?null:Number(floorAreaRaw),area_unit:String(formData.get("area_unit")??"").trim()||null,features:splitList(formData.get("features")),amenities:splitList(formData.get("amenities")),featured:formData.get("featured")==="on",updated_by:userId,updated_at:new Date().toISOString()}).eq("id",id);
  if(error)redirect("/admin?error=Could%20not%20save%20listing%20changes");
  redirect("/admin?saved=Listing%20details%20saved");
}

export async function deleteProperty(formData: FormData) {
  const {supabase,isAdmin}=await requireAdmin();if(!isAdmin)redirect("/admin/login");
  const id=String(formData.get("id")??"");if(!/^[0-9a-f-]{36}$/i.test(id))redirect("/admin?error=Invalid%20listing");
  const {data:photos,error:photoError}=await supabase.from("property_images").select("storage_path").eq("property_id",id);
  if(photoError)redirect("/admin?error=Could%20not%20load%20listing%20photos");
  if(photos?.length){const {error}=await supabase.storage.from("property-media").remove(photos.map((p)=>p.storage_path));if(error)redirect("/admin?error=Could%20not%20remove%20listing%20photos");}
  const {error}=await supabase.from("properties").delete().eq("id",id);
  if(error)redirect("/admin?error=Could%20not%20delete%20listing");
  redirect("/admin?saved=Listing%20deleted");
}
