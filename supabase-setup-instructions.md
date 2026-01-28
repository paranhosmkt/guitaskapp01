# Configuração de Pagamentos e Google OAuth (100% Online)

Siga estes passos para ativar o Google Login e o Checkout automático.

---

## 1. Google OAuth (Login com Google)
Para o botão "Entrar com Google" funcionar, você precisa configurar o Google Cloud:

1.  **Google Cloud Console**:
    *   Acesse [console.cloud.google.com](https://console.cloud.google.com/).
    *   Crie um novo projeto (ex: `Guitask-Auth`).
    *   Vá em **APIs & Services > OAuth consent screen**.
    *   Escolha **External**, preencha o nome do app e seu e-mail.
    *   Vá em **Credentials > Create Credentials > OAuth client ID**.
    *   Escolha **Web application**.
    *   Em **Authorized redirect URIs**, adicione a URL que o Supabase te fornecer (veja o passo abaixo).
    *   Copie o **Client ID** e o **Client Secret**.

2.  **Dashboard do Supabase**:
    *   Vá em **Authentication > Providers > Google**.
    *   Ative o provider.
    *   Cole o **Client ID** e o **Client Secret** obtidos no Google Cloud.
    *   Copie a **Callback URL** (ex: `https://xyz.supabase.co/auth/v1/callback`) e cole-a lá no Google Cloud Console (no campo "Authorized redirect URIs" que você abriu antes).
    *   Salve no Supabase.

---

## 2. Banco de Dados (SQL Editor)
Rode este comando no SQL Editor do Supabase para preparar tudo (Perfis + Realtime + Gatilho de Autocriação):

```sql
-- 1. Tabela de Perfis
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  is_pro boolean default false,
  updated_at timestamp with time zone default now()
);

-- 2. Gatilho para criar perfil automático (funciona para Google e E-mail)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Remove o trigger se já existir para evitar erro ao rodar novamente
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Ativa o Realtime
alter publication supabase_realtime add table profiles;
```

---

## 3. Webhook do Stripe (Edge Function)
No Dashboard do Supabase, crie a Edge Function `stripe-webhook` e use este código:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { type, data } = await req.json();
    if (type === 'checkout.session.completed') {
      const email = data.object.customer_details.email;
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseAdmin.from('profiles').update({ is_pro: true }).eq('email', email);
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
})
```

---

## 4. Webhook no Stripe
1. [Stripe Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2. Adicione a URL da sua função: `https://[SEU-ID].supabase.co/functions/v1/stripe-webhook`.
3. Evento: `checkout.session.completed`.