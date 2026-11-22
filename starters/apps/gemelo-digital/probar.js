// Chateá con tu gemelo desde la terminal, sin conectar WhatsApp.
// Uso: npm run probar
require('dotenv').config()
const readline = require('readline')
const { responder } = require('./gemelo')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log('💬 Escribile a tu gemelo como si fueras un contacto (Ctrl+C para salir)\n')

const preguntar = () =>
    rl.question('Vos: ', async (texto) => {
        const { respuesta, aviso } = await responder({ numero: 'prueba', nombre: 'Contacto de prueba', texto })
        if (respuesta) console.log(`Gemelo: ${respuesta}`)
        if (aviso) console.log(`   🔔 (aviso al dueño) ${aviso}`)
        console.log()
        preguntar()
    })

preguntar()
