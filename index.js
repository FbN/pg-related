import knex from 'knex'
import pg from 'pg'
import { initTypes } from 'pg-tuple-types'
import QueryBuilder from 'knex/lib/query/querybuilder.js'

const aliased = relation =>
    relation && typeof relation === 'object'
        ? Object.entries(relation)[0]
        : [relation, relation]

knex.QueryBuilder.extend('relation', function (relation) {
    this._relation = aliased(relation)
    return this
})

knex.QueryBuilder.extend('relate', function (relation, relationship) {
    const [alias, rel] = aliased(relation)
    this._relate = {
        ...this._relate,
        [rel]: [...(this.relate?.[rel] || []), { alias, relationship }]
    }
    return this
})

const multiRelation =
    withSubject =>
        ([relation, relationshipList]) => {
            const aggregate = relationshipList
                .map(r => `array_agg(distinct "${r.alias}")`)
                .join(' || ')
            const select =
            relationshipList.length > 1
                ? `ARRAY(select distinct unnest(${aggregate}))`
                : aggregate
            relationshipList.forEach(({ relationship }) =>
                relationship(withSubject)
            )
            withSubject.select(
                withSubject.client.raw(select + ` as  "${relation}"`)
            )
        }

const _then = QueryBuilder.prototype.then

QueryBuilder.prototype.then = function (onFulfilled, onRejected) {
    if (this._relation && this._relate) {
        const [subjectAlias, subjectRelation] = this._relation
        const withSubject = new this.constructor(this.client)
            .with(subjectAlias, this)
            .from(subjectAlias)
            .select(
                this.client.raw(
                    `array_agg("${subjectAlias}".*::${subjectRelation}) "${subjectRelation}"`
                )
            )
            .groupByRaw('true')
        Object.entries(this._relate).forEach(multiRelation(withSubject))
        return withSubject.first().then(onFulfilled, onRejected)
    }
    return _then.call(this, onFulfilled, onRejected)
}

export default cfg => {
    let typeInitialized = false
    return knex({
        ...cfg,
        pool: {
            ...cfg?.pool,
            afterCreate: (conn, done) => {
                const _done = (err, conn) =>
                    cfg?.pool?.afterCreate
                        ? cfg?.pool?.afterCreate(conn, done)
                        : done(err, conn)
                typeInitialized
                    ? done(null, conn)
                    : initTypes(pg.types)(conn)
                        .then(() => _done(null, conn))
                        .catch(err => _done(err, conn))
                        .finally(() => {
                            typeInitialized = true
                        })
            }
        }
    })
}
