


class ArrayResizer {

    constructor() {
        console.log(`Array Resizer`);
    }

    resizeMatrix = (inputMatrix, desiredWidth, desiredHeight) => {
        // Example
        // [
        //  [10, 20, 30],
        //  [20, 30, 40],
        //  [10, 20, 10]
        // ]
        // desired width 4, desired height 4
        // 1. start by resizing all the rows in place
        // 2. then transpose
        // 3. repeat step 1
        // 4. transpose again
        // 5. Is it that easy?

        for (let i = 0; i < inputMatrix.length; i++) {
            const currRow = inputMatrix[i];
            inputMatrix[i] = this.resizeRow(currRow, desiredWidth);
        }

        let outMatrix = this._transpose(inputMatrix);

        for (let i = 0; i < outMatrix.length; i++) {
            const currRow = outMatrix[i];
            outMatrix[i] = this.resizeRow(currRow, desiredHeight);
        }

        const transposed = this._transpose(outMatrix);
        return transposed;
    }

    resizeRow = (inputArr, desiredSize) => {

        // Okay obviously this can be done MUCH more efficiently but
        // since I have the math skills of a 3rd grader I'm doing it like this.

        // example
        // inputArr = [10, 20, 30]
        // inputWidth = 3
        // desiredWidth = 4
        // output = [10, 16.6, 23.3, 30]


        // okay the reducer thing will work IF we first find the common multiple
        // 1. Get common multiple
        // 3 x 4 = 12
        // 2. Expand inputArr to fit in array of common multiple
        // [10, 10, 10, 10, 20, 20, 20, 20, 30, 30, 30, 30]
        // 3. Reduce to desiredWidth chunks (4 in this case)
        // [10, 10, 10], [10, 20, 20], [20, 20, 30], [30, 30, 30]
        // 4. Get averages:
        // [10, 16.6, 23.3, 30]

        const lcm = this._leastCommonMultiple(inputArr.length, desiredSize);
        const bigArr = this._growRow(inputArr, lcm);
        return this._shrinkRow(bigArr, desiredSize);
    }

    _transpose(a) {

        // Calculate the width and height of the Array
        var w = a.length || 0;
        var h = a[0] instanceof Array ? a[0].length : 0;

        // In case it is a zero matrix, no transpose routine needed.
        if (h === 0 || w === 0) { return []; }

        /**
         * @var {Number} i Counter
         * @var {Number} j Counter
         * @var {Array} t Transposed data is stored in this array.
         */
        var i, j, t = [];

        // Loop through every item in the outer array (height)
        for (i = 0; i < h; i++) {

            // Insert a new row (array)
            t[i] = [];

            // Loop through every item per item in outer array (width)
            for (j = 0; j < w; j++) {

                // Save transposed data.
                t[i][j] = a[j][i];
            }
        }

        return t;
    }

    _leastCommonMultiple(x, y) {
        if ((typeof x !== 'number') || (typeof y !== 'number'))
            return false;
        return (!x || !y) ? 0 : Math.abs((x * y) / this._gcd_two_numbers(x, y));
    }

    _gcd_two_numbers(x, y) {
        x = Math.abs(x);
        y = Math.abs(y);
        while (y) {
            var t = y;
            y = x % y;
            x = t;
        }
        return x;
    }

    _splitToChunks(array, parts) {
        let result = [];
        for (let i = parts; i > 0; i--) {
            result.push(array.splice(0, Math.ceil(array.length / i)));
        }
        return result;
    }

    _growRow(inputArray, desiredSize) {

        if (inputArray.length == desiredSize) {
            return inputArray;
        }
        const outputArray = [];
        const mult = desiredSize / inputArray.length;
        // 12/3 = 4, so for every index of inputArray, apply that to 4 of outputArray
        for (let i = 0; i < inputArray.length; i++) {
            for (let j = 0; j < mult; j++) {
                outputArray.push(inputArray[i]);
            }
        }
        return outputArray;
    }

    _shrinkRow(inputArray, desiredSize) {
        if (inputArray.length <= desiredSize) {
            return inputArray;
        }

        const copy = inputArray.slice();
        const outThing = [];
        const chunks = this._splitToChunks(copy, desiredSize);

        for (const chunk of chunks) {
            outThing.push(chunk.reduce((a, b) => a + b) / chunk.length);
        }
        return outThing;
    }

}



export { ArrayResizer };