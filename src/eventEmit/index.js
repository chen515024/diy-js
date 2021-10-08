class EventEmit {
  constructor () {
    this.eventList = {};
  }

  on (key, cb) {
    const that = this;
    (that.eventList[key] || (that.eventList[key] = [])).push(cb);

    return that;
  }

  emit () {
    const that = this;
    const key = [].shift.call(arguments);
    if (!that.eventList[key]) {
      console.log('the event is not defined')
      return false;
    }
    const fns = [...that.eventList[key]];
    
    if (!fns.length) {
      return false;
    }

    fns.forEach(fn => {
      fn.apply(that, arguments);
    });

    return that;
  }

  once () {
    const key = arguments[0];
    this.emit(...arguments);
    this.off(key);
  }

  off (key) {
    const that = this;
    if (that.eventList[key]) {
      delete that.eventList[key];
    } else {
      console.log('the event is off');
    }

    return that;
  }
}

var eventEmit = new EventEmit();

eventEmit.on('submit', (args) => {
  console.log('on', args);
});

eventEmit.emit('submit', 1);

setTimeout(() => {
  eventEmit.once('submit', 2);
  eventEmit.emit('submit', 4);
}, 1000);

eventEmit.emit('submit', 3);
