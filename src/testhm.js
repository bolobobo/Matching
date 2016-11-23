function fab(n) {
    if (n <= 1) {
        return n;
    }
    return fab(n - 1) + fab(n - 2);
}

function fib(n) {
    var fib = [];
    fib[0] = 0;
    fib[1] = 1;
    fib[2] = 2;
    for(var i = 3; i < n; i++) {
        fib[i] = fib[i-1] + fib[i-2];
    }
    return fib[n-1];
}
console.log("hello");
console.log(fib(5))
