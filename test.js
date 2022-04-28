import 'dotenv/config'
import knex from './index.js'

const sql = knex({
    client: 'pg',
    connection: {
        user: process.env.DB_USER,
        database: process.env.DB_NAME
    },
    serarchpath: ['public']
})
;(async () => {
    const out = await sql('cart')
        .select('cart.*')
        .join('cart_row', 'cart.id', 'cart_row.cart_id')
        .limit(10)
        .relation({ c: 'cart' })
        .relate({ cu: 'customer' }, q =>
            q.join({ cu: 'customer' }, 'cu.id', 'c.customer_id')
        )
        .relate({ cr: 'cart_row' }, q =>
            q.join({ cr: 'cart_row' }, 'cr.cart_id', 'c.id')
        )
    console.log(JSON.stringify(out, null, ' '))
})().finally(() => sql.destroy())
