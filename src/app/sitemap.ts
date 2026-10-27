import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
  const fixed=["/","/privacy"].map((path)=>({url:new URL(path,base).toString(),lastModified:new Date()}));
  try{const supabase=await createClient();const {data}=await supabase.from("properties").select("slug,updated_at").eq("publication_status","published").in("availability_status",["available","under_offer"]);return [...fixed,...(data??[]).map((p)=>({url:new URL(`/properties/${p.slug}`,base).toString(),lastModified:new Date(p.updated_at)}))]}catch{return fixed}
}
