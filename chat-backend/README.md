# SocialClip website chat

Stateless website agent for the existing HTML site. AI SDK 7 `ToolLoopAgent`, read-only catalog tool, and Vercel AI Gateway. A separate backend keeps credentials off GitHub Pages. No account access, email sending, reservations, purchases, or other write tools.

## Current state

- Widget and separate `/chat-vorschau/` design preview are implemented.
- Preview explicitly does not send messages or simulate model responses.
- Backend is disabled unless `CHAT_ENABLED=true`.
- Current production pages have not been changed to display the widget.
- Knowledge snapshot: 14 service pages from repository commit `1eafc5c6f51cc32c860a4287ccdd5276ae6e5c9e`, 2026-10-21.

## Deployment

Deploy this directory as a separate Vercel project, Node.js 24, no frontend framework, Frankfurt function region. `api/chat.js` uses the fetch Web API. Vercel OIDC authenticates to AI Gateway; do not commit an API key. Local scripts can use an uncommitted `AI_GATEWAY_API_KEY`.

`GET /api/chat` reports availability without a model call. `POST /api/chat` requires explicit chat consent, an alternating user/assistant conversation, and bounded input. Unknown origins are rejected. Responses are not cached. Model errors are sanitized. The server does not log message contents or IP addresses.

## Before public activation

1. Obtain the owner's monthly spending limit and configure a hard **project budget in AI Gateway**. Do not infer that free credits imply a zero-cost cap. The warm-instance flood protection is best-effort and is not a durable/global cost limit. Gateway billing/credits and model availability must be valid.
2. Enable `CHAT_ENABLED=true` only after the spending cap and provider setup are verified. Model default: `openai/gpt-5.4-mini`, verified in the live Gateway catalog on 2026-10-21; configurable with `AI_GATEWAY_MODEL`.
3. Verify the production backend is public and its CORS preflight permits exactly `https://socialclip.art` and `https://www.socialclip.art`. Preview deployment protection must not be disabled as a workaround.
4. Update the site's privacy policy with the actual live architecture: voluntary KI chat, transmission of submitted conversation to Vercel and OpenAI, purpose, data types, provider locations/transfers, processor agreements, provider retention settings, and the owner's applicable legal basis. Do not claim legal certification, zero retention, or completed processor agreements without verifying them.
5. Add the module to the approved site pages, exactly once, with the verified production endpoint:

```html
<link rel="stylesheet" href="/chat-agent.css?v=1">
<script>window.SocialClipChatConfig={enabled:true,endpoint:"https://VERIFIED_BACKEND_HOST/api/chat"};</script>
<script src="/chat-agent.js?v=1" defer></script>
```

6. Test one real conversation and a follow-up: service lookup, no fabricated prices, no booking/email claims, local draft handoff, failed requests, keyboard close, and phone layout. No test form submissions. Confirm actual AI Gateway usage/cost and re-check the configured spending limit. Replace the preview notice only after these pass.

## Data flow

The visitor explicitly starts the AI chat before a POST. Messages live in page memory until reload/reset; the application does not persist the transcript in browser storage or a database. Vercel/Gateway/provider infrastructure has its own retention and must be reflected accurately in the privacy policy. No analytics events contain chat text.

The "Anfrage vorbereiten" button transfers an explicitly requested draft into the existing contact form. It does not submit the form or overwrite an existing visitor draft. On pages without the contact form it provides a copyable draft; nothing is sent automatically.

## Verification

`npm ci && npm test` tests disabled activation, origins/preflight, explicit consent, role/input/byte limits, public health, safe tool links, model failure handling, flood limits, and widget consent/rendering/draft/reset/retry behavior. These use mocks, incur no AI charges, and do not establish real model quality or dashboard receipt.
