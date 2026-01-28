# Configuração Webhook 100% Online

Siga estes passos dentro dos Dashboards para ativar o pagamento automático.

---

## 1. SQL Editor (Supabase)
Copie e rode este comando no SQL Editor do Supabase para preparar a tabela de perfis:

```sql
-- Garante que a tabela existe
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  is_pro boolean default false,
  updated_at timestamp with time zone default now()
);

-- Ativa o Realtime para esta tabela (CRUCIAL)
alter publication supabase_realtime add table profiles;
```

---

## 2. Edge Function (Supabase)
No Dashboard do Supabase, vá em **Edge Functions** e clique em **"Create New Function"**.
Dê o nome de `stripe-webhook`. Cole o código abaixo:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    const { type, data } = await req.json();

    if (type === 'checkout.session.completed') {
      const session = data.object;
      const email = session.customer_details.email;

      // Conexão Admin para ignorar segurança e atualizar o status
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: true })
        .eq('email', email);

      console.log(`Sucesso: ${email} agora é PRO.`);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
})
```

---

## 3. Webhook (Stripe)
1. Vá no [Stripe Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2. Clique em **Add Endpoint**.
3. No campo **URL**, cole a URL da sua Edge Function (ela aparece no dashboard do Supabase após salvar). 
   *Ex: https://xyz.supabase.co/functions/v1/stripe-webhook*
4. Selecione o evento: `checkout.session.completed`.
5. Clique em **Add endpoint**.

---

## 4. Variáveis de Ambiente (Supabase)
Vá em **Settings > API** e certifique-se que o Supabase já tem as variáveis padrão:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (esta é secreta, usada pela função).

Tudo pronto! Agora, quando alguém pagar, o Supabase atualizará o banco e o seu App (que está "ouvindo" em tempo real) ativará o modo Pro na hora.