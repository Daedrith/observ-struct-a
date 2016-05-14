observ-struct-a
===============

An observable object. Based on [Raynos/observ-struct](https://github.com/Raynos/observ-struct/).

Differences
-----------

- If a property value on the object passed to the factory is not a function, it is made into a simple observable.
- Uses `Object.freeze` on emitted values.
- Overrides `name` and `length` properties on the observable instance, if needed by user properties.
- `.transaction(callback)` executes callback and publishes a new object once. `.set` uses the same mechanism, so that excess listener calls are avoided.
- A listener function with no arguments (`.length === 0`) will be called when object is updated, but will not receive the new value. If all listeners are argumentless, an emitted value is not created until the observable is read.
