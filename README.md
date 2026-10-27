# Jeshurun Dealers property platform

Company-controlled real-estate catalogue for Jeshurun Dealers. Public visitors can browse published inventory, filter and sort listings, open a photo gallery, and submit enquiries. Only explicitly allow-listed administrators can create, edit, publish, unpublish, or delete listings and manage photos and enquiries.

## Local setup

Requires Node.js 20.9 or newer.

1. Copy `.env.example` to `.env.local` and set the Supabase project URL, anon key, service-role key, and public site URL. Keep the service-role key server-only and never commit `.env.local`.
2. Run `npm install` and then `npm run dev`.
3. Open `http://localhost:3000`.

The site intentionally shows an empty inventory when the database has no published listings. Add real listing details and client-approved photos in the admin dashboard before publishing; no demo properties or testimonials are shipped.

## Supabase setup

Apply `supabase/migrations/202610270001_platform.sql` to the target Supabase project using the SQL editor or Supabase CLI. It creates the listing, image, enquiry, and admin allow-list tables, RLS policies, the public image bucket, and a durable per-phone enquiry throttle. Public database reads are limited to published listings whose availability is `available` or `under_offer`. Public clients cannot insert enquiries or change listings.

Create the first administrator using Supabase Auth's trusted dashboard or admin API. Then add that existing Auth user's UUID to `public.admin_users` in the SQL editor:

```sql
insert into public.admin_users (user_id)
values ('<the-auth-user-uuid>');
```

Disable public signups in Supabase Auth. Do not put passwords or the service-role key in source code. The server verifies signed claims and checks the database allow-list on every admin operation.

## Production configuration

Set these environment variables in the hosting provider and redeploy:

- `NEXT_PUBLIC_SITE_URL`: canonical HTTPS domain.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable/anon key.
- `SUPABASE_SERVICE_ROLE_KEY`: private server environment only; never use a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: international digits only, default `254705895736`.

Run `npm run build` before deployment. Apply the database migration, create and allow-list the initial administrator, sign in at `/admin/login`, add accurate property details and photos, then publish. Review `/privacy` and replace the draft with the company's approved privacy and data-retention notice before collecting real enquiries. Configure hosting-level firewall or edge rate limiting for `/api/enquiries`; the database throttle is per phone number and does not replace IP or bot protection. Confirm the contact, WhatsApp and Instagram links and production domain.

## Important operating details

- Photo uploads allow JPEG, PNG, WebP or AVIF up to 10 MB. The storage bucket is public for published listing images; writes require the admin role.
- A listing cannot be published while available or under offer until it has a photo and a meaningful description, title, location and non-zero price.
- Property detail routes and sitemap entries are generated from published, available or under-offer records.
- Contact details supplied for this site: +254 705 895736, WhatsApp +254 705 895736, Instagram [@jeshurun_dealers_](https://www.instagram.com/jeshurun_dealers_/).

## Launch checklist

- [ ] Add production Supabase URL and keys to hosting environment settings.
- [ ] Apply the migration and confirm the policies in the production project.
- [ ] Create the first Auth user privately, insert its UUID into `admin_users`, and disable public signups.
- [ ] Set the canonical site URL and production WhatsApp number.
- [ ] Configure hosting firewall/rate limiting for the public enquiry route.
- [ ] Replace the draft privacy notice with client-approved language.
- [ ] Add verified listings and client-approved photos; confirm availability and contact actions.
- [ ] Build and deploy, then verify public browsing, enquiry delivery, administrator access and photo uploads on the deployed domain.
