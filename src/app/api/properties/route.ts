import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("properties").select("id,reference,slug,title,description,listing_type,property_type,availability_status,price,currency,location_name,county,area_name,bedrooms,bathrooms,land_area,floor_area,area_unit,features,amenities,featured,property_images(storage_path,alt_text,display_order)").eq("publication_status", "published").in("availability_status", ["available","under_offer"]).order("featured", { ascending: false }).order("published_at", { ascending: false }).limit(100);
    if (error) throw error;
    const rows = (data ?? []).map((p) => {
      const images = [...(p.property_images ?? [])].sort((a,b)=>a.display_order-b.display_order).map((image)=>({url:supabase.storage.from("property-media").getPublicUrl(image.storage_path).data.publicUrl,alt:image.alt_text}));
      const area = p.land_area ? `${p.land_area} ${p.area_unit ?? ""}`.trim() : p.floor_area ? `${p.floor_area} ${p.area_unit ?? ""}`.trim() : "";
      return { id:p.id,ref:p.reference,slug:p.slug,title:p.title,description:p.description,type:p.property_type?`${p.property_type[0].toUpperCase()}${p.property_type.slice(1)}`:"Property",listing:p.listing_type,availability:p.availability_status,location:p.area_name ? `${p.area_name}, ${p.location_name}` : p.location_name,price:Number(p.price),priceText:`${p.currency} ${Number(p.price).toLocaleString("en-KE")}${p.listing_type==="rent"?" / month":""}`,beds:p.bedrooms,baths:p.bathrooms,area,featured:p.featured,features:p.features,amenities:p.amenities,photos:images.map((image)=>image.url),photoAlt:images.map((image)=>image.alt)};
    });
    return NextResponse.json(rows,{headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    console.error("Public property query failed", error);
    return NextResponse.json({error:"Listings are temporarily unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
