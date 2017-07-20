export function Action(type, transform = p => p) {
  function creator(payload) {
    payload = transform(payload)
    const action = { type }
    if (payload !== undefined) {
      action.payload = payload
    }
    if (payload instanceof Error) {
      action.error = true
    }
    return action
  }
  creator.type = type
  return creator
}

export function transform(creator, transform) {
  const { type } = creator
  const transformed = (payload, ...args) => creator(transform(payload), ...args)
  if (type !== undefined) {
    transformed.type = type
  }
  return transformed
}

function copy(value) {
  return Array.isArray(value) ? value.slice() : Object.assign({}, value)
}

export default function Reducer(prefix, initial, handlers, options = {}) {
  options = Object.assign(
    {
      copy: false,
    },
    options
  )
  const reducers = {}

  const reducer = (state = initial, action) => {
    const { type, payload } = action
    if (reducers.hasOwnProperty(type)) {
      state = options.copy ? copy(state) : state
      return reducers[type](state, payload, action)
    } else {
      return state
    }
  }

  Object.keys(handlers).forEach(key => {
    const handler = handlers[key]
    const type = prefix + '/' + key
    reducer[key] = Action(type)
    reducers[type] = handler
  })

  return reducer
}
