import {expect} from 'chai'
import {sql} from 'kysely'

import type {SurrealKysely} from '../../../src'
import {dropTable, getDb, insertArticles, insertCompanies, insertUsers, testSurrealQl, type Database} from './shared'

describe('SurrealKysely.relate(...)', () => {
  let db: SurrealKysely<Database>

  before(async () => {
    db = getDb()

    await insertUsers()
    await insertArticles()
    await insertCompanies()
  })

  after(async () => {
    await dropTable('write')
    await dropTable('like')
    await dropTable('company')
    await dropTable('user')
    await dropTable('article')
  })

  it('should execute a relate...set query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        'time.written': sql`time::now()`,
      })

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set time.written = time::now()',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set query between multiple specific users and devs.', async () => {
    const query = db
      .relate('like')
      .from(db.selectFrom('company:surrealdb').select('users'))
      .to(
        db
          .selectFrom('user')
          .where(sql`${sql.ref('tags')} contains ${sql.literal('developer')}`)
          .selectAll(),
      )
      .set({
        'time.connected': sql`time::now()`,
      })

    testSurrealQl(query, {
      sql: 'relate $1 -> like -> $2 set time.connected = time::now()',
      parameters: [
        'SURREALQL::(select users from company:surrealdb)',
        "SURREALQL::(select * from user where tags contains 'developer')",
      ],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').that.is.not.empty
  })

  it('should execute a relete...content query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .content(sql`{source: 'Apple notes', tags: ['notes', 'markdown'], time: {written: time::now()}}`)

    testSurrealQl(query, {
      sql: [
        'relate user:tobie -> write -> article:surreal',
        "content {source: 'Apple notes', tags: ['notes', 'markdown'], time: {written: time::now()}}",
      ],
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set query between two specific records (table and id in separate arguments).', async () => {
    const query = db
      .relate('write')
      .from('user', 'tobie')
      .to('article', 'surrealql')
      .set({
        'time.written': sql`time::now()`,
      })

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surrealql set time.written = time::now()',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set...return none query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        'time.written': sql`time::now()`,
      })
      .return('none')

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set time.written = time::now() return none',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').that.is.empty
  })

  it('should execute a relate...set...return diff query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        'time.written': sql`time::now()`,
      })
      .return('diff')

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set time.written = time::now() return diff',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set...return before query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        'time.written': sql`time::now()`,
      })
      .return('before')

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set time.written = time::now() return before',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set...return after query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        'time.written': sql`time::now()`,
      })
      .return('after')

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set time.written = time::now() return after',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set...return field query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        'time.written': sql`time::now()`,
      })
      .return('time')

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set time.written = time::now() return time',
      parameters: [],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })

  it('should execute a relate...set...return multiple fields query between two specific records.', async () => {
    const query = db
      .relate('write')
      .from('user:tobie')
      .to('article:surreal')
      .set({
        source: 'Samsung notes',
        'time.written': sql`time::now()`,
      })
      .return(['source', 'time'])

    testSurrealQl(query, {
      sql: 'relate user:tobie -> write -> article:surreal set source = $1, time.written = time::now() return source, time',
      parameters: ['Samsung notes'],
    })

    const actual = await query.execute()

    expect(actual).to.be.an('array').which.has.lengthOf(1)
  })
})