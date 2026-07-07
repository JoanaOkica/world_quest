# Próximos passos — o que falta para a app funcionar e chegar às lojas

Estado em 2026-07-08. O código está pronto para o cenário real: projeto
Supabase **partilhado** com o pet-game, com a World Quest isolada no schema
`world_quest`. Este documento lista, por ordem, o que **só tu** podes fazer.
Tudo o resto já está feito no código/na base de dados (ver
`supabase/remote/README.md`).

## 1. Supabase — 15 minutos, desbloqueia tudo

1. **Expor o schema** (obrigatório, nada funciona sem isto):
   *Dashboard → Settings → API → Data API → Exposed schemas* → adicionar
   `world_quest`. Sem isto, a app e as edge functions recebem
   `PGRST106 (schema not exposed)`.
2. **Aplicar a migration social** `supabase/remote/0003_world_quest_social.sql`
   (amigos, região→dono, leaderboards, GDPR). Podes pedir-me para a aplicar —
   fica a aguardar o teu OK — ou colá-la no SQL Editor.
3. **Provider de SMS** (login por telefone):
   *Authentication → Providers → Phone* → ativar e configurar Twilio (ou
   Vonage/MessageBird). Precisa de conta tua no provider. Sem isto ninguém
   entra na app.
4. **Bucket de fotos**: *Storage → New bucket* → nome `captures`, **privado**,
   limite 10 MB. (As políticas de acesso do bucket posso escrever eu — pede.)
5. **Deploy das edge functions** (precisa do teu access token):
   ```bash
   npx supabase login                    # abre browser
   npx supabase link --project-ref ypnrlvylutmqsiftfili
   npx supabase functions deploy score-trip verify-capture delete-account resolve-claims
   npx supabase secrets set ATTESTATION_MODE=dev   # até o App Attest real estar ligado
   ```

## 2. Segredos da app — 5 minutos

Criar `apps/mobile/.env` (nunca commitar):
```
EXPO_PUBLIC_SUPABASE_URL=https://ypnrlvylutmqsiftfili.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Settings → API → anon public>
EXPO_PUBLIC_MAPBOX_TOKEN=<token em account.mapbox.com — precisa de conta Mapbox>
```
O token Mapbox precisa do scope `DOWNLOADS:READ` (é usado no build nativo).

## 3. Primeiro build instalável (APK para testares no telemóvel)

```bash
npm i -g eas-cli
cd apps/mobile
eas login                 # conta Expo gratuita
eas build -p android --profile preview
```
O `eas.json` já está no repositório. O perfil `preview` produz um **APK**
instalável direto no Android. Para iOS no teu iPhone: `--profile development`
+ conta Apple Developer (ver secção 5).

## 4. Antes de produção (não bloqueia testes)

- **Attestation real** (App Attest/Play Integrity): hoje o servidor em modo
  `enforce` rejeita tudo (fail-closed) e por isso testamos com
  `ATTESTATION_MODE=dev`. Ligar os módulos nativos é a única peça de código
  em falta para produção — pede quando quiseres começar.
- **Regiões reais**: o seed tem 6 cidades com bounding boxes aproximadas.
  Importar limites reais (OSM/GADM) quando quiseres o mapa a sério.
- **Ícone + splash**: `app.config.ts` está pronto a recebê-los; falta a arte.

## 5. Lojas — inteiramente do teu lado

| Passo | Onde | Custo |
|---|---|---|
| Conta Apple Developer | developer.apple.com | 99 €/ano |
| Conta Google Play Console | play.google.com/console | 25 € (única) |
| Build de produção | `eas build -p ios|android --profile production` | — |
| Submissão | `eas submit -p ios|android` | — |
| Fichas das lojas | screenshots, descrição, **política de privacidade (URL pública, obrigatória — a app trata localização e fotos)** | — |
| Review | Apple ~1-3 dias; Google ~1-7 dias | — |

Ordem recomendada: TestFlight/Internal testing primeiro, produção depois.

## Recapitulação do que já está feito

- Schema `world_quest` isolado criado no projeto partilhado (RLS em tudo);
  seed + `region_at()` aplicados; pet-game intocado.
- App aponta ao schema `world_quest`; perfil criado no 1.º login.
- Globo 3D (`projection="globe"`, Mapbox v11) com filtro **Todos / Eu / Amigos**.
- Bugs do QA corrigidos: modo de transporte já não é confiável do cliente,
  velocidade máxima por modo, `storagePath` validado, typecheck verde.
- `eas.json` + versões iOS/Android prontos para build.
