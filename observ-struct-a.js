import ObservProp from './observ-prop.js';

let transaction = Symbol('startTransaction');

function ObservStructA(defaults)
{
  let publishedVal;
  let createVal = () =>
  {
    publishedVal = Object.assign({}, val);
    for (let pullProp of pullProps) publishedVal[pullProp] = defaults[pullProp]();

    // make freeze optional?
    Object.freeze(publishedVal);
    return publishedVal;
  };

  let listeners = [];
  let lazyListeners = [];
  let obs = l =>
  {
    if (!l)
    {
      return publishedVal || createVal();
    }
    else if (l.length === 0)
    {
      lazyListeners.push(l);
      return () => lazyListeners.splice(lazyListeners.indexOf(l), 1);
    }
    else
    {
      listeners.push(l);
      return () => listeners.splice(listeners.indexOf(l), 1);
    }
  };

  // TODO: store as private symbols, expose as "static" methods?
  let pullProps = []; // list of props to pull from observable in defaults
  let inTransaction = false;
  let publish = () =>
  {
    if (listeners.length > 0)
    {
      // maybe check for a clone method?
      if (!publishedVal && listeners.length) createVal();

      for (let l of listeners) l(publishedVal);
    }

    for (let l of lazyListeners) l();
  };

  obs.transaction = (cb) =>
  {
    // TODO: counter or exception for nested transactions
    inTransaction = true;
    
    try
    {
      cb();
    }
    finally
    {
      inTransaction = false;
      if (!publishedVal) publish();
    }
  };
  // TODO: "static" method instead?
  obs[transaction] = obs.transaction; // in case user needs this key name

  // Create properties on obs that hold the observable for each property in the struct
  let val = {}; // mutated by each ObservProp
  let keys = Object.keys(defaults);
  for (let key of keys)
  {
    // TODO: wrappers to modify behavior?
    let prop;
    if (typeof defaults[key] === 'function')
    {
      prop = defaults[key];
      pullProps.push(key);
    }
    else
    {
      prop = ObservProp(val, key);
      val[key] = defaults[key];
    }

    prop(() =>
    {
      // when a property's value changes, schedule a publish to listeners of the struct
      publishedVal = null;
      if (!inTransaction) publish();
    });

    if (key === 'name' || key === 'length') delete obs[key];
    Object.defineProperty(obs, key, {
      value: prop,
      configurable: true,
      enumerable: true,
      writable: false,
    });
  }

  // make sure we have an immutable copy (TODO: shuold really just copy the pullprops)
  if (pullProps.length) defaults = Object.assign({}, defaults);

  obs.set = v =>
  {
    if (!v) return;

    // when setting the whole value, only mutate the props that change existing ones
    obs.transaction(() =>
    {
      for (let key of keys)
      {
        if (Object.prototype.hasOwnProperty.call(v, key)) obs[key].set(v[key]);
      }
    });
  };

  return obs;
};

ObservStructA.transaction = transaction;

export default ObservStructA;
