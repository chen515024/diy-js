function isFunction (fn) {
  return Object.prototype.toString.call(fn).toLocaleLowerCase() === '[object function]';
}

function isObject (obj) {
  return Object.prototype.toString.call(obj).toLocaleLowerCase() === '[object object]';
}

function isPromise (p) {
  return p instanceof My_Promise;
}

function fulfilledPromise (promise, value) {
  if (promise.status !== statusMap.PENDING) {
    return;
  }

  promise.status = statusMap.FULFILLED;
  promise.value = value;

  runCbs(promise.resolveCbs, value);
}

// 2.3
function resolvePromise (promise, x) {
  // 2.3.1
  if (promise === x) {
    rejectedPromise(promise, new TypeError('cant be the same'));
    return;
  }
  // 2.3.2
  if (isPromise(x)) {
    // 2.3.2.1
    if (x.status === statusMap.PENDING) {
      x.then(
        () => {
          fulfilledPromise(promise, x.value);
        },
        () => {
          rejectedPromise(promise, x.reason);
        }
      );
      return;
    }
    // 2.3.2.2
    if (x.status === statusMap.FULFILLED) {
      fulfilledPromise(promsie, x.value);
      return;
    }
    // 2.3.2.3
    if (x.status === statusMap.REJECTED) {
      rejectedPromise(promise, x.reason);
      return;
    }
    return;
  }

  // 2.3.3
  if (isObject(x) || isFunction(x)) {
    let then;
    let called = false;
    try {
      // 2.3.3.1
      then = x.then;
    } catch (error) {
      // 2.3.3.2
      rejectedPromise(promise, error);
      return;
    }
    // 2.3.3.3
    if (isFunction(then)) {
      try {
        then.call(
          x,
          // 2.3.3.3.1
          y => {
            // 2.3.3.3.3
            if (called) {
              return;
            }
            called = true;
            resolvePromise(promise, y);
          },
          // 2.3.3.3.2
          r => {
            // 2.3.3.3.3
            if (called) {
              return;
            }
            called = true;
            rejectedPromise(promise, r);
          }
        )
      } catch (error) {
        // 2.3.3.3.4
        if (called) {
          // 2.3.3.3.4.1
          return;
        }
        called = true;
        // 2.3.3.3.4.2
        rejectedPromise(promise, error);
      }
      return;
    } else {
      // 2.3.3.4
      fulfilledPromise(promise, x);
      return;
    }
  } else {
    // 2.3.4
    fulfilledPromise(promise, x);
    return;
  }
}

function rejectedPromise (promise, reason) {
  // 2.1.3
  if (promise.status !== statusMap.PENDING) {
    return;
  }
  // 2.1.3.1
  promise.status = statusMap.REJECTED;
  // 2.1.3.2
  promise.reason = reason;

  runCbs(promise.rejectedCbs, reason);
}

function runCbs (cbs, value) {
  cbs.forEach(cb => cb(value));
}

const statusMap = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED'
}
class My_Promise {
  constructor (fn) {
    // 2.1
    this.status = statusMap.PENDING;
    //1.3
    this.value = undefined;
    // 1.5
    this.reason = undefined;

    this.resolveCbs = [];
    this.rejectedCbs = [];
    fn (
      value => resolvePromise(this, value),
      reason => rejectedPromise(this, reason)
    );
  }
  // 1.2
  then (onFulfilled, onRejected) {
    const promise1 = this, promise2 = new Promise(() => {});
    // 2.2
    if (promise1.status === statusMap.FULFILLED) {
      // 2.2.1
      if (!isFunction(onFulfilled)) {
        // 2.2.1.1
        return promise1;
      }
      // 2.2.2
      // 2.2.2.1
      setTimeout(() => {
        try {
          // 2.2.2.1
          // 2.2.7.1
          const x = onFulfilled(promise1.value);
          resolvePromise(promise2, x);
        } catch (err) {
          // 2.2.7.2
          rejectedPromise(promise2, err);
        }
      }, 0);
    }

    if (promise1.status === statusMap.REJECTED) {
      // 2.2.1
      if (!isFunction(onRejected)) {
        // 2.2.1.2
        return promise1;
      }
      // 2.2.3
      setTimeout(() => {
        // 2.2.3.1
        try {
          // 2.2.7.1
          const x = onRejected(promise1.reason);
          rejectedPromise(promise2, x);
        } catch (err) {
          // 2.2.7.2
          rejectedPromise(promise2, err);
        }
      }, 0);
    }
    if (promise1.status === statusMap.PENDING) {
      // 2.2.7.3
      onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => {
        return value;
      }

      // 2.2.7.4
      onRejected = isFunction(onRejected) ? onRejected : reason => {
        throw reason;
      }

      // 2.2.6
      promise1.resolveCbs.push(() => {
        setTimeout(() => {
          try {
            // 2.2.6.1
            const x = onFulfilled(promise1.value);
            resolvePromise(promise2, x);
          } catch (err) {
            rejectedPromise(promise2, err);
          }
        }, 0);
      });

      promise1.rejectedCbs.push(() => {
        setTimeout(() => {
          try {
            // 2.2.6.2
            const r = onRejected(promise1.reason);
            resolvePromise(promise2, r);
          } catch (err) {
            rejectedPromise(promise2, err);
          }
        })
      });
    }

    // 2.2.4
    return promise2;
  }
}

My_Promise.deferred = function () {
  const deferred = {};
  deferred.promise = new My_Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

module.exports = My_Promise;