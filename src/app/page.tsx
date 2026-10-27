"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

type Property = {
  ref: string; slug: string; title: string; type: string; listing: "sale" | "rent";
  location: string; area: string; price: number; priceText: string;
  beds?: number; baths?: number; availability: string; photos: string[]; photoAlt?:string[];
};

const photo = (id:string,width=1200)=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
const whatsappNumber=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"254705895736";

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [enquiryState,setEnquiryState]=useState("");
  const [enquiryBusy,setEnquiryBusy]=useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [listing, setListing] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => { fetch("/api/properties", { cache: "no-store" }).then(async (r) => { if (!r.ok) throw new Error("Could not load properties"); return r.json(); }).then((rows: Property[]) => setProperties(rows)).catch(() => setLoadError(true)).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    const found = properties.filter((p) => (!q || `${p.title} ${p.location} ${p.type}`.toLocaleLowerCase().includes(q)) && (!type || p.type === type) && (!listing || p.listing === listing) && (!location || p.location === location) && (!budget || p.price <= Number(budget)));
    return [...found].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : properties.indexOf(a) - properties.indexOf(b));
  }, [query, type, listing, location, budget, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);
  const clear = () => { setQuery(""); setType(""); setListing(""); setLocation(""); setBudget(""); setPage(1); };
  async function sendEnquiry(event:FormEvent<HTMLFormElement>){event.preventDefault();const formElement=event.currentTarget;setEnquiryBusy(true);setEnquiryState("");const form=new FormData(formElement);try{const response=await fetch("/api/enquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:form.get("name"),phone:form.get("phone"),email:form.get("email"),message:form.get("message"),company:form.get("company")})});const result=await response.json();if(!response.ok)throw new Error(result.error||"Could not send enquiry.");formElement.reset();setEnquiryState("Thank you. Your enquiry has been sent to Jeshurun Dealers.");}catch(error){setEnquiryState(error instanceof Error?error.message:"Could not send enquiry. Please use WhatsApp.");}finally{setEnquiryBusy(false);}}

  return <>
    <div className="topline"><div className="shell topline-inner"><span>PROPERTY THAT MOVES YOU</span><span>KENYA <i>Homes · Land · Commercial</i></span></div></div>
    <header className="nav"><div className="shell nav-inner"><a className="brand" href="#home"><img src="/jeshurun-logo.jpg" alt="Jeshurun Dealers logo"/><span><b>Jeshurun Dealers</b><small>Your real estate solution</small></span></a><nav><a href="#properties">Properties</a><a href="#about">About</a><a href="#contact">Contact</a></nav><a className="button button-dark" href="#contact">Talk to our team <span>↗</span></a></div></header>
    <main id="home">
      <section className="hero"><div className="hero-image"/><div className="shell hero-inner"><div className="hero-copy"><span className="kicker">A better way to find your place</span><h1>Come home to<br/><em>what matters.</em></h1><p>From a first home to a piece of land for the future, find a place in Kenya that feels right for you.</p><div className="hero-actions"><a className="button" href="#properties">Explore properties <span>↗</span></a><a className="button button-outline" href="#contact">Contact us</a></div></div></div><div className="hero-tag">Find your place · Kenya</div></section>
      <section className="shell search-wrap" aria-label="Search properties"><form className="search" onSubmit={(e) => { e.preventDefault(); setPage(1); document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" }); }}>
        <label>Location<select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }}><option value="">All locations</option>{[...new Set(properties.map((p) => p.location))].map((v) => <option key={v} value={v}>{v}</option>)}</select></label>
        <label>Property type<select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}><option value="">Any type</option>{[...new Set(properties.map((p) => p.type))].map((v) => <option key={v}>{v}</option>)}</select></label>
        <label>Looking to<select value={listing} onChange={(e) => { setListing(e.target.value); setPage(1); }}><option value="">Buy or rent</option><option value="sale">Buy</option><option value="rent">Rent</option></select></label>
        <label>Maximum budget<select value={budget} onChange={(e) => { setBudget(e.target.value); setPage(1); }}><option value="">Any budget</option><option value="5000000">KES 5M</option><option value="15000000">KES 15M</option><option value="50000000">KES 50M</option></select></label>
        <label className="query-label">Search<input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Property or neighbourhood"/></label><button className="button button-dark" type="submit">Find a property&nbsp; →</button>
      </form></section>
      <section id="properties" className="section shell"><div className="section-heading"><div><span className="kicker dark-kicker">A considered collection</span><h2>Find a place to<br/>make your own.</h2></div><p>Browse homes, land and commercial opportunities. Search by location, budget and the kind of place you have in mind.</p></div>
        <div className="results-bar"><span>{filtered.length} {filtered.length === 1 ? "property" : "properties"} shown</span><label>Sort by <select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label><button className="text-button" onClick={clear}>Clear filters</button></div>
        {loading?<div className="empty" role="status">Loading current listings…</div>:loadError?<div className="empty" role="alert"><b>Listings are temporarily unavailable</b><p>Please try again shortly or ask our team directly.</p><button className="button button-dark" onClick={()=>window.location.reload()}>Try again</button></div>:<div className="cards">{current.map((p) => <article className="property-card" key={p.ref}><a className="card-photo" href={`/properties/${p.slug}`}>{p.photos.length>0?<img src={p.photos[0]} alt={p.photoAlt?.[0]||p.title} loading="lazy"/>:<div className="no-image">Photos coming soon</div>}<span className="status">{p.availability.replace("_"," ")}</span><span className="open-card">View property ↗</span></a><div className="card-content"><div className="meta">{p.location} <span>·</span> {p.listing === "sale" ? "For sale" : "For rent"} · {p.type}</div><a href={`/properties/${p.slug}`}><h3>{p.title}</h3></a><strong className="price">{p.priceText}</strong><div className="specs">{p.beds && <span>{p.beds} bedrooms</span>}{p.baths && <span>{p.baths} bathrooms</span>}{p.area&&<span>{p.area}</span>}<small>{p.ref}</small></div></div></article>)}</div>}
        {!loading&&!loadError&&!current.length && <div className="empty"><b>{properties.length?"No matching properties":"No properties currently listed"}</b><p>{properties.length?"Try broadening your search or contact us with what you’re looking for.":"Contact our team to discuss what you’re looking for."}</p>{properties.length>0&&<button className="button button-dark" onClick={clear}>Clear search</button>}</div>}
        {filtered.length > pageSize && <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>← Previous</button><span>Page {page} of {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}>Next →</button></div>}
      </section>
      <section className="location-band"><div className="shell"><span className="kicker dark-kicker">Browse by location</span><h2>Start with the place.</h2><div className="location-links">{[...new Set(properties.map((p) => p.location))].map((place) => <button key={place} onClick={() => { setLocation(place); setPage(1); document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" }); }}>{place}<span>↗</span></button>)}</div></div></section>
      <section id="about" className="section shell about"><div className="about-image"><img src={photo("photo-1600607687939-ce8a6c25118c", 1200)} alt="Illustrative architectural interior" loading="lazy"/></div><div><span className="kicker dark-kicker">A personal approach</span><h2>Property is more<br/>than a place.</h2><p>It’s where life unfolds, plans take shape, and the future begins. Jeshurun Dealers helps people explore property that fits where they are and where they want to go.</p><p>Tell our team what matters to you. We’ll help you explore the options and arrange a conversation about the next step.</p><a className="button button-dark" href="#contact">Speak with our team ↗</a></div></section>
      <section id="contact" className="contact"><div className="shell contact-inner"><div><span className="kicker">Your next move starts here</span><h2>Tell us what<br/>you’re looking for.</h2><p>Ask a question or request a viewing. We’ll continue the conversation with you directly.</p><div className="contact-actions"><a href={`tel:+${whatsappNumber}`}>Call +254 705 895736</a><a className="button" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappNumber}`}>Chat on WhatsApp ↗</a><a href="https://www.instagram.com/jeshurun_dealers_/" target="_blank" rel="noreferrer">Instagram @jeshurun_dealers_ ↗</a></div></div><form className="public-enquiry" onSubmit={sendEnquiry}><label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={120}/></label><label>Phone / WhatsApp<input name="phone" autoComplete="tel" type="tel" required minLength={7} maxLength={32}/></label><label>Email (optional)<input name="email" autoComplete="email" type="email" maxLength={254}/></label><label>How can we help?<textarea name="message" required minLength={2} maxLength={4000} rows={3}/></label><label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off"/></label><button className="button" disabled={enquiryBusy}>{enquiryBusy?"Sending…":"Send enquiry"}</button>{enquiryState&&<p role="status">{enquiryState}</p>}</form></div></section>
    </main><footer><div className="shell footer"><a className="brand" href="#home"><img src="/jeshurun-logo.jpg" alt=""/><span><b>Jeshurun Dealers</b><small>Your real estate solution</small></span></a><span>© {new Date().getFullYear()} Jeshurun Dealers</span><a href="/privacy">Privacy notice</a></div><p className="shell demo-note">Property information and availability are confirmed by Jeshurun Dealers. Please enquire before making a decision.</p></footer>
  </>;
}
