const promise = new Promise((resolve, reject) => {
  resolve('test');
});

promise.then(resolve => {
  console.log(resolve, 'then resolve');
}, reject => {
  console.log(reject, 'then reject');
});
