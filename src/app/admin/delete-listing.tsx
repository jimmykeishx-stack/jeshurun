"use client";
import { deleteProperty } from "@/app/admin/actions";
export default function DeleteListing({id}:{id:string}){return <form action={deleteProperty} onSubmit={(event)=>{if(!window.confirm("Delete this listing and its photos? This cannot be undone."))event.preventDefault();}}><input type="hidden" name="id" value={id}/><button className="danger-button">Delete listing</button></form>}
