import Reducer, { Action, transform } from '.'

describe('Action', () => {
  const type = 'foo'
  const a = Action(type)

  it('should return a function and type', () => {
    expect(typeof a).toBe('function')
    expect(a.type).toBe(type)
  })

  it('should return type and payload when called', () => {
    const payload = 'bar'
    expect(a()).toEqual({ type })
    expect(a(payload)).toEqual({ type, payload })
  })

  it('should set error when error object is passed', () => {
    const payload = new Error()
    expect(a(payload)).toEqual({ type, payload, error: true })
  })

  it('should transform payload and args', () => {
    const transform = jest.fn()
    const a = Action(type, transform)
    const payload = 'bar'
    const args = ['lorem', 'ipsum']
    const value = 'baz'

    transform.mockReturnValueOnce(value)
    expect(a(payload)).toEqual({ type, payload: value })
    expect(transform.mock.calls.length).toBe(1)
    expect(transform.mock.calls[0][0]).toBe(payload)

    transform.mockReturnValueOnce(value)
    expect(a(payload, ...args)).toEqual({ type, payload: value })
    expect(transform.mock.calls.length).toBe(2)
    expect(transform.mock.calls[1][0]).toBe(payload)
    expect(transform.mock.calls[1]).toEqual([payload, ...args])
  })
})

describe('transform', () => {
  const type = 'foo'
  const creator = jest.fn()
  const transformer = jest.fn()
  creator.type = type
  const transformed = transform(creator, transformer)

  it('should not set type', () => {
    expect(transform(() => {}, () => {}).type).toBeUndefined()
  })

  it('should set type', () => {
    expect(transformed.type).toBe(type)
  })

  it('should call creator and transformer', () => {
    const payload = 'bar'
    const args = ['lorem', 'ipsum']
    const value = 'baz'
    const action = 'foobaz'

    transformer.mockReturnValueOnce(value)
    creator.mockReturnValueOnce(action)
    expect(transformed(payload)).toEqual(action)
    expect(creator.mock.calls.length).toBe(1)
    expect(creator.mock.calls[0][0]).toBe(value)
    expect(transformer.mock.calls.length).toBe(1)
    expect(transformer.mock.calls[0][0]).toBe(payload)

    transformer.mockReturnValueOnce(value)
    creator.mockReturnValueOnce(action)
    expect(transformed(payload, ...args)).toEqual(action)
    expect(creator.mock.calls.length).toBe(2)
    expect(creator.mock.calls[1][0]).toBe(value)
    expect(transformer.mock.calls.length).toBe(2)
    expect(transformer.mock.calls[1][0]).toBe(payload)
    expect(transformer.mock.calls[1]).toEqual([payload, ...args])
  })
})

describe('Reducer', () => {
  const prefix = 'prefix'
  const initial = { foo: 0 }
  const createReducer = (handler, options) =>
    Reducer(prefix, initial, { handler }, options)
  const type = `${prefix}/handler`

  it('should return initial state', () => {
    const reducer = createReducer(() => {})
    expect(typeof reducer).toBe('function')
    expect(reducer(undefined, { type: 'init' })).toBe(initial)
  })

  it('should have action creator', () => {
    const reducer = createReducer(() => {})
    const payload = 'bar'
    const args = ['lorem', 'ipsum']
    expect(typeof reducer.handler).toBe('function')
    expect(reducer.handler.type).toBe(type)
    expect(reducer.handler()).toEqual({ type })
    expect(reducer.handler(payload)).toEqual({ type, payload })
    expect(reducer.handler(payload, ...args)).toEqual({ type, payload })
  })

  it('should call handler with payload and action', () => {
    const handler = jest.fn()
    const reducer = createReducer(handler)
    const payload = 'bar'
    const value = 'baz'
    handler.mockReturnValueOnce(value).mockReturnValueOnce(value)

    let action = { type }
    expect(reducer(undefined, action)).toBe(value)
    expect(handler.mock.calls.length).toBe(1)
    expect(handler.mock.calls[0]).toEqual([initial, undefined, action])

    action = { type, payload }
    expect(reducer(undefined, action)).toBe(value)
    expect(handler.mock.calls.length).toBe(2)
    expect(handler.mock.calls[1]).toEqual([initial, payload, action])
  })

  it('should copy state', () => {
    const handler = jest.fn()
    const reducer = createReducer(handler, { copy: true })
    const action = { type }
    const value = 'baz'
    handler.mockReturnValueOnce(value).mockReturnValueOnce(value)

    let state = ['lorem', 'ipsum', 1, 2]
    expect(reducer(state, action)).toBe(value)
    expect(handler.mock.calls.length).toBe(1)
    expect(handler.mock.calls[0][0]).toEqual(state)
    expect(handler.mock.calls[0][0]).not.toBe(state)

    state = { lorem: 1, ipsum: 2 }
    expect(reducer(state, action)).toBe(value)
    expect(handler.mock.calls.length).toBe(2)
    expect(handler.mock.calls[1][0]).toEqual(state)
    expect(handler.mock.calls[1][0]).not.toBe(state)
  })
})
