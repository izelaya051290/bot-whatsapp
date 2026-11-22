const fs = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const MODELO = 'claude-opus-5-5'
const MARCA_AVISO = '[[AVISAR]]'
const MEMORIA = Number(process.env.MEMORIA_MENSAJES || 30)

const client = new Anthropic()
const perfil = fs.readFileSync(path.join(__dirname, 'perfil.md'), 'utf8')

const INSTRUCCIONES = `Sos el gemelo digital de la persona descrita en el perfil de abajo. Respondés sus
mensajes de WhatsApp como lo haría ella: mismo tono, mismas expresiones, mismo largo de mensaje.

Cómo responder:
- Escribí como un mensaje de WhatsApp real: corto y natural, sin listas ni formato de documento,
  salvo que la persona lo haría así.
- Adaptá el trato según el contacto (cliente, colega, amigo) usando lo que diga la conversación.
- No inventes datos (precios, fechas, compromisos, disponibilidad) que no estén en el perfil.
  Si no sabés algo, decí que lo confirmás y avisá al dueño.
- Nunca aceptes compromisos, pagos, citas ni decisiones importantes en nombre de la persona:
  decí que lo revisa y avisá al dueño.
- Seguí las reglas del perfil sobre qué compartir y qué no, y sobre qué decir si te preguntan
  si sos un bot. Nunca niegues ser un asistente si alguien lo pregunta sinceramente.

Avisos al dueño: cuando el tema requiera que la persona real intervenga (lo que el perfil dice que
"siempre me pasa a mí", algo urgente, una queja, o algo que no sabés), agregá al final de tu
respuesta una línea aparte que empiece con ${MARCA_AVISO} seguida de un resumen breve para el dueño.
Esa línea no la ve el contacto.

=== PERFIL ===
${perfil}`

/** Historial por contacto: Map<numero, MessageParam[]> */
const historiales = new Map()

function recortar(historial) {
    while (historial.length > MEMORIA) historial.shift()
    // La conversación debe empezar con un mensaje del usuario
    while (historial.length && historial[0].role !== 'user') historial.shift()
}

/**
 * Genera la respuesta del gemelo para un mensaje entrante.
 * @returns {{ respuesta: string, aviso: string | null }}
 */
async function responder({ numero, nombre, texto }) {
    const historial = historiales.get(numero) || []
    historial.push({ role: 'user', content: `${nombre ? `[${nombre}] ` : ''}${texto}` })
    recortar(historial)

    let mensaje
    try {
        mensaje = await client.beta.messages.create({
            model: MODELO,
            max_tokens: 16000,
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            output_config: { effort: 'low' },
            system: [{ type: 'text', text: INSTRUCCIONES, cache_control: { type: 'ephemeral' } }],
            messages: historial,
        })
    } catch (error) {
        historial.pop()
        if (error instanceof Anthropic.AuthenticationError) {
            console.error('❌ ANTHROPIC_API_KEY inválida o faltante')
        } else if (error instanceof Anthropic.RateLimitError) {
            console.error('⏳ Límite de uso de la API alcanzado, reintentá más tarde')
        } else if (error instanceof Anthropic.APIError) {
            console.error(`❌ Error de la API (${error.status}):`, error.message)
        } else {
            console.error('❌ Error de conexión con Claude:', error)
        }
        return { respuesta: null, aviso: `No pude responder a ${nombre || numero}: "${texto}"` }
    }

    if (mensaje.stop_reason === 'refusal') {
        historial.pop()
        return { respuesta: null, aviso: `Mensaje de ${nombre || numero} que prefiero que veas vos: "${texto}"` }
    }

    const completo = mensaje.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim()

    const [respuesta, ...resto] = completo.split(MARCA_AVISO)
    const aviso = resto.length ? resto.join(' ').trim() : null

    historial.push({ role: 'assistant', content: mensaje.content })
    historiales.set(numero, historial)

    return { respuesta: respuesta.trim() || null, aviso }
}

module.exports = { responder }
