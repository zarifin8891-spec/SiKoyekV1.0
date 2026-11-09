-- Synthetic, standalone PostgreSQL 17 test schema. Never use production data.
\set ON_ERROR_STOP on
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN;
CREATE TABLE public.roles (
    id uuid PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY,
    role_id uuid REFERENCES public.roles(id),
    is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.permissions (
    id uuid PRIMARY KEY
);
CREATE TABLE public.role_permissions (
    role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
INSERT INTO public.roles(id,name,is_active) VALUES
 ('22222222-2222-4222-8222-222222222222','ADMIN',true),
 ('33333333-3333-4333-8333-333333333333','PELAKSANA',true);
INSERT INTO public.profiles(id,role_id,is_active) VALUES
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',true),
 ('77777777-7777-4777-8777-777777777777','33333333-3333-4333-8333-333333333333',true),
 ('88888888-8888-4888-8888-888888888888','22222222-2222-4222-8222-222222222222',false);
INSERT INTO public.permissions(id) VALUES
 ('44444444-4444-4444-8444-444444444444'),
 ('55555555-5555-4555-8555-555555555555'),
 ('66666666-6666-4666-8666-666666666666');
INSERT INTO public.role_permissions(role_id,permission_id) VALUES
 ('33333333-3333-4333-8333-333333333333','44444444-4444-4444-8444-444444444444'),
 ('33333333-3333-4333-8333-333333333333','55555555-5555-4555-8555-555555555555');
