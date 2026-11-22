require('dotenv').config()
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const { responder } = require('./gemelo')

const NUMERO_DUENO = (process.env.NUMERO_DUENO || '').trim()
const IGNORADOS = new Set(
    (process.env.NUMEROS_IGNORADOS || '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean)
)

let pausado = false

const flowGemelo = addKeyword(EVENTS.WELCOME).addAction(async (ctx, { flowDynamic, provider }) => {
    const numero = ctx.from
    const texto = (ctx.body || '').trim()

    // Comandos del dueño (escribiendo desde su número personal al número del gemelo)
    if (NUMERO_DUENO && numero === NUMERO_DUENO) {
        const comando = texto.toLowerCase()
        if (comando === '!pausa') {
            pausado = true
            return flowDynamic('⏸️ Gemelo en pausa. Escribí !activar para reanudar.')
        }
        if (comando === '!activar') {
            pausado = false
            return flowDynamic('▶️ Gemelo activo de nuevo.')
        }
        if (comando === '!estado') {
            return flowDynamic(pausado ? '⏸️ En pausa' : '▶️ Activo')
        }
    }

    if (pausado || IGNORADOS.has(numero) || !texto) return

    const { respuesta, aviso } = await responder({ numero, nombre: ctx.pushName, texto })

    if (respuesta) await flowDynamic(respuesta)

    if (aviso && NUMERO_DUENO && numero !== NUMERO_DUENO) {
        const quien = ctx.pushName ? `${ctx.pushName} (${numero})` : numero
        await provider.sendText(`${NUMERO_DUENO}@s.whatsapp.net`, `🔔 *Aviso del gemelo*\nDe: ${quien}\n${aviso}`)
    }
})

const main = async () => {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  Falta ANTHROPIC_API_KEY en el archivo .env')
    }

    createBot({
        flow: createFlow([flowGemelo]),
        provider: createProvider(BaileysProvider),
        database: new MockAdapter(),
    })

    QRPortalWeb()
}

main()
