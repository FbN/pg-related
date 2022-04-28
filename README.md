pg-lateral
========

Add knex (postgres) support query and retrive related data in
simple and optimized way.

* composite tuples
* arrays of tuples

## Installing

```
$ yarn add pg-related
```

## Usage

```js
import knex from 'pg-related'

const sql = knex({
    client: 'pg',
    connection: process.env.PG_CONNECTION_STRING,
    serarchpath: ['public']
})

;(async () => {
    const out =
        // write as usual a knex query
        await sql('cart')
        .select('cart.*')
        .join('cart_row', 'cart.id', 'cart_row.cart_id')
        .limit(10)
        // tell that you want to get it as related data
        // "c" is an alias
        // "cart" is the name you give to your relation (relation type)
        .relation({ c: 'cart' })
        // add relations
        // each relation has an alias, a relation name (relation type)
        // and a query snippet on how to retrive the related data
        // Probably you will use a join or a lateral subquery.
        .relate({ cu: 'customer' }, q =>
            q.join({ cu: 'customer' }, 'cu.id', 'c.customer_id')
        )
        .relate({ cr: 'cart_row' }, q =>
            q.join({ cr: 'cart_row' }, 'cr.cart_id', 'c.id')
        )

    console.log(JSON.stringify(out, null, ' '))
    // the result will be a single object
    // with a field for each relation type.
    // each relation is an array of all data.
    // Data is retrived as tuple, not JSON, pg-type
    // data conversions are applied.
    // {
    //     cart: [...],
    //     customer: [...],
    //     cart_row: [...]
    // }
})().finally(() => sql.destroy())

```

## License

Copyright © 2022 [Fabiano Taioli](http://fbn.github.io/);
Released under the MIT license.
