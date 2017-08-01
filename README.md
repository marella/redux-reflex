# redux-reflex

Reduce boilerplate code by automatically creating action creators and action types from reducers.

[![Build Status](https://travis-ci.org/marella/redux-reflex.svg?branch=master)](https://travis-ci.org/marella/redux-reflex) [![Coverage Status](https://coveralls.io/repos/github/marella/redux-reflex/badge.svg)](https://coveralls.io/github/marella/redux-reflex)

<!-- TOC depthFrom:2 depthTo:3 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Installation](#installation)
- [Example](#example)
- [Documentation](#documentation)
	- [Reducer](#reducer)
	- [Actions](#actions)
	- [Async Actions](#async-actions)
	- [Reusing Reducer Logic](#reusing-reducer-logic)
- [License](#license)

<!-- /TOC -->


## Installation

```bash
npm install redux-reflex --save
```


## Example

*reducer.js*

```js
import Reducer from 'redux-reflex'

const prefix = 'counter'
const initialState = { count: 0 }
const handlers = {
  // called when action type is 'counter/increment'
  increment(state, amount) {
    return { ...state, count: state.count + amount }
  },
  // called when action type is 'counter/decrement'
  decrement(state, amount) {
    return { ...state, count: state.count - amount }
  },
}

const counter = Reducer(prefix, initialState, handlers)

export default counter
```

This will create a reducer function `counter` with `initialState` as the initial state and `handlers` as case reducers. `handlers` handle actions with type starting with `prefix`.

You don't have to define action creators or action types. They are automatically created and attached to the reducer function:

```js
counter.increment // action creator (function)

counter.increment.type // action type (string) - 'counter/increment'

counter.increment() // creates action (object) - { type: 'counter/increment' }

dispatch(counter.increment(5)) // increases count by 5
```


## Documentation

Generated actions are similar to [Flux Standard Action].

```js
counter.increment()
/*
{
  type: 'counter/increment',
}
*/

counter.increment(5)
/*
{
  type: 'counter/increment',
  payload: 5,
}
*/
```

If payload is an instance of an [`Error`][Error] object then `error` is automatically set to `true`.

```js
counter.increment(new Error())
/*
{
  type: 'counter/increment',
  payload: new Error(),
  error: true,
}
*/
```

### Reducer

The main `Reducer` function creates a reducer and corresponding action creators and types.

```js
import Reducer from 'redux-reflex'

const todos = Reducer(...)
```

#### `Reducer(prefix, initialState, handlers, options = {})`

##### `prefix`

`prefix` should be unique as `prefix + '/'` is used as a prefix for the action types that are automatically created. You can follow this convention to keep them unique: `<app-name>/<feature-name>/<reducer-name>`.

##### `initialState`

Initial value of the state managed by reducer.

##### `handlers`

Action `handlers` let you split the reducer code into smaller functions instead of using `switch-case` statements. These are also called "case reducers".

###### `handler(state, payload, action)`

Each `handler` should be a pure function that reads current state, payload and action and returns a new state: `(state, payload, action) => state`. A typical reducer function looks like `(state, action) => state` but here `payload` is passed as the second argument as it will be required most of the time. If you need more info about an action, you can always use the third argument `action` which contains action type, payload and other data related to action. For example, to check if an action is dispatched because of an error:

```js
// some action handler
fetched(state, payload, { error }) {
  // state should not be modified directly
  // so do a shallow copy first
  state = { ...state }

  // state updates common to both success and failure cases
  state.fetching = false

  // failure case
  if (error) {
    state.error = payload
    return state
  }

  // success case
  state.data = payload
  return state
}
```

Here we used [Destructuring assignment] to unpack `error` from the third argument `action`.

##### `options`

`options` object is used for configuring the `Reducer`. Currently these options are available:

```js
{
  copy: false,
  // when `true`, `Reducer` automatically does a shallow copy of `state`
  // before calling a handler function
}
```

```js
import Reducer from 'redux-reflex'

const todos = Reducer(
  'todos',
  { todos: [] },
  {
    // this function will be called when action type is 'todos/add'
    add(state, { text }) {
      // Since `copy` option is set to `true`, `Reducer` automatically
      // does a shallow copy of `state` before calling this function.
      // So you don't have to do `{ ...state }`.

      // `concat()` returns a new copy of array
      // and doesn't modify the original one.
      // `push()` should not be used as it modifies
      // the original array.
      state.todos = state.todos.concat(text)

      return state
    },
  },
  { copy: true }
)
```

Here we used [Destructuring assignment] to unpack `text` from `payload`. If `payload` is not passed as second argument then unpacking complex objects becomes hard to read.

### Actions

Action creators are automatically created from reducer functions. If you need to define more action creators, you can use the `Action` function:

```js
import { Action } from 'redux-reflex'

todos.add = Action('todos/add')

todos.add({ text: 'some task' })
/*
{
  type: 'todos/add',
  payload: { text: 'some task' },
}
*/
```

#### `Action(type, transform = payload => payload)`

##### `type`

`type` specifies the action type and should be unique. You can follow this convention to keep it unique: `<app-name>/<feature-name>/<reducer-name>/<action-name>`.

##### `transform`

`transform` is a function that can be used to modify the payload:

```js
import { Action } from 'redux-reflex'

todos.add = Action('todos/add', payload => ({ text: payload }))

todos.add('some task')
/*
{
  type: 'todos/add',
  payload: { text: 'some task' },
}
*/
```

#### `transform(actionCreator, transform)`

Apply a transform function to existing action creators:

```js
import Reducer, { transform } from 'redux-reflex'

const todos = Reducer(...) // assume that todos.add is already defined here

todos.add('some task')
/*
{
  type: 'todos/add',
  payload: 'some task',
}
*/

todos.add = transform(todos.add, payload => ({ text: payload }))

todos.add('some task')
/*
{
  type: 'todos/add',
  payload: { text: 'some task' },
}
*/
```

### Async Actions

Async actions can be handled using a middleware like [`redux-thunk`][redux-thunk]:

```js
// define `todos.fetching` and `todos.fetched` using `Reducer` function
// and use the `error` property inside `todos.fetched` handler function
// to handle both success and failure cases
todos.fetch = () => dispatch => {
  dispatch(todos.fetching())
  return api
    .get('/todos')
    .then(response => dispatch(todos.fetched(response.data)))
    .catch(error => dispatch(todos.fetched(error)))
}

// dispatch it like a normal action
dispatch(todos.fetch())
```

### Reusing Reducer Logic

Let's say you want to have two counters both having their own state but with same functionality. To do so, you just have to define two reducers with same initial state and handlers:

```js
import { combineReducers, createStore } from 'redux'
import Reducer from 'redux-reflex'

const initialState = { count: 0 }
const handlers = {
  increment(state, amount) {
    return { ...state, count: state.count + amount }
  },
  decrement(state, amount) {
    return { ...state, count: state.count - amount }
  },
}

const counter1 = Reducer('counter1', initialState, handlers)
const counter2 = Reducer('counter2', initialState, handlers)

const store = createStore(combineReducers({ counter1, counter2 }))
```

Here `counter1` and `counter2` have their own slice of state and calling an action of one counter doesn't affect the state of other.

```js
counter1.increment() // handled by counter1 reducer
/*
{
  type: 'counter1/increment',
}
*/

counter2.increment() // handled by counter2 reducer
/*
{
  type: 'counter2/increment',
}
*/
```

## License

[MIT][license]


[license]: /LICENSE
[Flux Standard Action]: https://github.com/acdlite/flux-standard-action
[redux-thunk]: https://github.com/gaearon/redux-thunk
[Error]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[Destructuring assignment]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment
