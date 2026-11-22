# Gemelo digital 🤖👤

Un bot de WhatsApp que responde **como vos**: con tu tono, tus expresiones y tus
reglas, para clientes y contactos personales. Usa Claude (Anthropic) para conversar
y Baileys para conectarse a WhatsApp con un código QR.

## Cómo funciona
- **`perfil.md`**: tu personalidad. Es lo único que tenés que editar.
- **Memoria por contacto**: recuerda los últimos mensajes de cada chat (en RAM; se
  borra al reiniciar).
- **Avisos**: si un tema necesita que intervengas (precios especiales, quejas,
  compromisos, algo que no sabe), te manda un mensaje a `NUMERO_DUENO`.
- **No promete nada en tu nombre**: no acepta citas, pagos ni decisiones; dice que lo
  revisás vos.
- **Honesto**: si alguien pregunta en serio si es un bot, no lo niega.

## Instalación
```bash
cd starters/apps/gemelo-digital
npm install
cp .env.example .env      # y completá ANTHROPIC_API_KEY y NUMERO_DUENO
```

## 1. Probalo en la terminal (sin WhatsApp)
```bash
npm run probar
```
Ajustá `perfil.md` hasta que suene como vos.

## 2. Conectalo a WhatsApp
```bash
npm start
```
Abrí http://localhost:3000 y escaneá el QR desde WhatsApp → *Dispositivos vinculados*.
Recomendado: usar un número aparte (o WhatsApp Business) para el gemelo.

## Comandos (desde tu `NUMERO_DUENO`)
| Comando | Qué hace |
|---|---|
| `!pausa` | El gemelo deja de responder |
| `!activar` | Vuelve a responder |
| `!estado` | Muestra si está activo |

## Notas
- Modelo: `claude-opus-5-5` con esfuerzo bajo (respuestas rápidas). Tiene activado el
  *fallback* del lado del servidor: si el modelo declina un mensaje, la API lo reintenta
  con otro modelo; si todos declinan, el gemelo no responde y te avisa.
- Cada mensaje consume tokens de la API de Anthropic (costo por uso).
- Baileys no es la API oficial de WhatsApp; usalo con moderación para evitar bloqueos.
