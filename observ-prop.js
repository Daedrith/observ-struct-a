export default function ObservProp(obj, name)
{
  let listeners = [];
  let obs = l =>
  {
    if (!l) return obj[name];

    listeners.push(l);
    return () => listeners.splice(listeners.indexOf(l), 1);
  };

  obs.set = v =>
  {
    if (obj[name] === v) return;
    
    obj[name] = v;
    for (let l of listeners) l(v);
  };

  return obs;
};
