const statusMap = {
  PENDING: 'PENDING',
  FULFILLED: 'FULFILLED',
  REJECTED: 'REJECTED'
}

function isFunction (fn) {
  return Object.prototype.toString.call(fn).toLocaleLowerCase() === '[object function]';
}

function isObject (obj) {
  return Object.prototype.toString.call(obj).toLocaleLowerCase() === '[object object]';
}

function isPromise (p) {
  return p instanceof Promise;
}

function runCbs (cbs, value) {
  cbs.forEach(cb => cb(value));
}

function fulfilledPromise (promise, value) {
  if (promise.status !== statusMap.PENDING) {
    return;
  }

  promise.status = statusMap.FULFILLED;
  promise.value = value;
  // 2.2.6.1
  runCbs(promise.fulfilledCbs, value);
}

function rejectedPromise (promise, reason) {
  if (promise.status !== statusMap.PENDING) {
    return;
  }

  promise.status = statusMap.REJECTED;
  promise.reason = reason;
  // 2.2.6.2
  runCbs(promise.rejectedCbs, reason);
}

// 2.3 promise 解析过程
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
        () => fulfilledPromise(promise, x.value),
        () => rejectedPromise(promise, x.reason)
      );
      return;
    }
    // 2.3.2.2
    if (x.status === statusMap.FULFILLED) {
      fulfilledPromise(promise, x.value);
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
    } catch (err) {
      // 2.3.3.2
      rejectedPromise(promise, err);
      return;
    }
    if (isFunction(then)) {
      try {
        // 2.3.3.3
        then.call(
          x,
          y => {
            // 2.3.3.3.3
            if (called) {
              return;
            }
  
            called = true;
            // 2.3.3.3.1
            resolvePromise(promise, y)
          },
          r => {
            // 2.3.3.3.3
            if (called) {
              return;
            }
  
            called = true;
            // 2.3.3.3.2
            rejectedPromise(promise, r)
          }
        );
      } catch (err) {
        if (called) {
          return;
        }

        called = true;
        rejectedPromise(promise, err);
      }
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

// 1.1
class Promise {
  constructor (fn) {
    this.status = statusMap.PENDING;
    // 1.3
    this.value = undefined;
    // 1.5
    this.reason = undefined;
    this.fulfilledCbs = []; // then callback resolve
    this.rejectedCbs = []; // then callback reject
    fn(
      value => resolvePromise(this, value),
      reason => rejectedPromise(this, reason)
    );
  }
  // 2.2
  then (onFulfilled, onRejected) {
    const promise1 = this, promise2 = new Promise(() => {});

    if (promise1.status === statusMap.FULFILLED) {
      // 2.2.1.1
      if (!isFunction(onFulfilled)) {
        return promise1;
      }
      // 2.2.2
      setTimeout(() => {
        try {
          // 2.2.2.1
          const x = onFulfilled(promise1.value);
          resolvePromise(promise2, x);
        } catch (err) {
          rejectedPromise(promise2, err);
        }
      }, 0);
    }

    if (promise1.status === statusMap.REJECTED) {
      // 2.2.1.2
      if (!isFunction(onRejected)) {
        return promise1;
      }
      // 2.2.3
      setTimeout(() => {
        try {
          // 2.2.3.1
          const x = onRejected(promise1.reason);
          resolvePromise(promise2, x);
        } catch (err) {
          rejectedPromise(promise2, err);
        }
      });
    }
    // 2.2.4
    if (promise1.status === statusMap.PENDING) {
      // 2.2.5
      // 2.2.7.3
      onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value;
      // 2.2.7.4
      onRejected = isFunction(onRejected) ? onRejected : reason => { throw reason };
      // 2.2.6
      // 2.2.6.1
      promise1.fulfilledCbs.push(() => {
        setTimeout(() => {
          try {
            // 2.2.7.1
            const x = onFulfilled(promise1.value);
            resolvePromise(promise2, x);
          } catch (err) {
            // 2.2.7.2
            rejectedPromise(promise2, err);
          }
        }, 0);
      });
      // 2.2.6.2
      promise1.rejectedCbs.push(() => {
        setTimeout(() => {
          try {
            // 2.2.7.1
            const x = onRejected(promise1.reason);
            resolvePromise(promise2, x);
          } catch (err) {
            // 2.2.7.2
            rejectedPromise(promise2, err);
          }
        }, 0);
      });
    }
    // 2.2.7
    return promise2;
  }
}

// 添加 promise-test
Promise.deferred = function () {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

module.exports = Promise;