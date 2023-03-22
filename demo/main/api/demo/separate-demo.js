exports = module.exports = tuple('log!normal', 'lib',
  function separateDemo (log, lib) {
    async function useFunction(r) {
      let result = Promise.resolve({function_demo: 'function_demo separateDemo data'});

      return result
    }

    return {useFunction}

  })