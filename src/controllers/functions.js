let functions={
    async asyncForEach(array, callback)
    {
        for (let index = 0; index < array.length; index++)
        {
           callback(array[index], index, array);
        }
    }
};
module.exports = functions;