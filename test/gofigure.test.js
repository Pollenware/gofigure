var it = require("it"),
    assert = require("assert"),
    comb = require("comb"),
    fs = require("fs"),
    goFigure = require("../index.js");

var conf1 = {
    "a":1,
    "b":{
        "c":1,
        "d":2
    },
    "e":{
        "f":3,
        "g":{
            "h":4
        }
    }
};

var conf2 = {
    "b":{
        "c":2
    },
    "i":{
        "j":5,
        "k":6
    },
    "l":7
};

var envConf = {
    "development":{
        "a":1,
        "b":{
            "c":2,
            "d":3
        },
        "e":{
            "f":4,
            "g":{
                "h":5
            }
        }
    },
    "production":{
        "a":6,
        "b":{
            "c":7,
            "d":8
        },
        "e":{
            "f":9,
            "g":{
                "h":10
            }
        }
    },
    "test":{
        "a":11,
        "b":{
            "c":12,
            "d":13
        },
        "e":{
            "f":14,
            "g":{
                "h":15
            }
        }
    }
};

it.describe("GoFigure", function (it) {

    it.beforeEach(function () {
        fs.writeFileSync(__dirname + "/configs/configs1/config1.json", JSON.stringify(conf1, null, 4));
        fs.writeFileSync(__dirname + "/configs/configs2/config2.json", JSON.stringify(conf2, null, 4));
        fs.writeFileSync(__dirname + "/configs/config-env/config.json", JSON.stringify(envConf, null, 4));
    });

    it.afterEach(function () {
        fs.writeFileSync(__dirname + "/configs/configs1/config1.json", JSON.stringify(conf1, null, 4));
        fs.writeFileSync(__dirname + "/configs/configs2/config2.json", JSON.stringify(conf2, null, 4));
        fs.writeFileSync(__dirname + "/configs/config-env/config.json", JSON.stringify(envConf, null, 4));
    });

    it.describe("#load", function (it) {
        it.should("load configuration from directories", function (next) {
            var config1 = goFigure({locations:[__dirname + "/configs/configs1"]});
            var config2 = goFigure({locations:[__dirname + "/configs/configs2"]});
            config1.load(
                function (err, res) {
                    assert.deepEqual(res, conf1);
                }).then(function () {
                    config2.load(
                        function (err, res) {
                            if (!err) {
                                assert.deepEqual(res, conf2);
                                next(null);
                            }
                        }).addErrback(next);
                }, next);
        });

        it.should("load configuration from files", function (next) {
            var config1 = goFigure({files:[__dirname + "/configs/configs1/config1.json"]});
            var config2 = goFigure({files:[__dirname + "/configs/configs2/config2.json"]});
            config1.load(
                function (err, res) {
                    assert.deepEqual(res, conf1);
                }).then(function () {
                    config2.load(
                        function (err, res) {
                            assert.deepEqual(res, conf2);
                            next(null);
                        }).addErrback(next);
                }, next);
        });

        it.describe("with an env", function (it) {
            it.should("from directories", function (next) {
                var configDev = goFigure({environment:"development", locations:[__dirname + "/configs/config-env"]});
                var configProd = goFigure({environment:"production", locations:[__dirname + "/configs/config-env"]});
                var configTest = goFigure({environment:"test", locations:[__dirname + "/configs/config-env"]});
                configDev.load(
                    function (err, res) {
                        assert.deepEqual(res, envConf.development);
                    }).then(function () {
                        configProd.load(
                            function (err, res) {
                                if (!err) {
                                    assert.deepEqual(res, envConf.production);
                                    next(null);
                                }
                            }).then(function () {
                                configTest.load(
                                    function (err, res) {
                                        if (!err) {
                                            assert.deepEqual(res, envConf.test);
                                            next(null);
                                        }
                                    }).addErrback(next);
                            }, next);
                    }, next);
            });

            it.should("from files", function (next) {
                var configDev = goFigure({environment:"development", files:[__dirname + "/configs/config-env/config.json"]});
                var configProd = goFigure({environment:"production", files:[__dirname + "/configs/config-env/config.json"]});
                var configTest = goFigure({environment:"test", files:[__dirname + "/configs/config-env/config.json"]});
                configDev.load(
                    function (err, res) {
                        assert.deepEqual(res, envConf.development);
                    }).then(function () {
                        configProd.load(
                            function (err, res) {
                                if (!err) {
                                    assert.deepEqual(res, envConf.production);
                                    next(null);
                                }
                            }).then(function () {
                                configTest.load(
                                    function (err, res) {
                                        if (!err) {
                                            assert.deepEqual(res, envConf.test);
                                            next(null);
                                        }
                                    }).addErrback(next);
                            }, next);
                    }, next);
            });
        });
    });

    it.describe("#loadSync", function (it) {
        it.should("load configuration from certain directories", function () {
            var config1 = goFigure({locations:[__dirname + "/configs/configs1"]});
            var config2 = goFigure({locations:[__dirname + "/configs/configs2"]});
            assert.deepEqual(config1.loadSync(), conf1);
            assert.deepEqual(config2.loadSync(), conf2);
        });

        it.should("load configuration from certain directories", function () {
            var config1 = goFigure({files:[__dirname + "/configs/configs1/config1.json"]});
            var config2 = goFigure({files:[__dirname + "/configs/configs2/config2.json"]});
            assert.deepEqual(config1.loadSync(), conf1);
            assert.deepEqual(config2.loadSync(), conf2);
        });

        it.should("load should call listeners when setting", function (next) {
            var config1 = goFigure({files:[__dirname + "/configs/configs1/config1.json"]});
            var res = [];
            ["a", "b", "b.c", "b.f", "e", "e.f", "e.g", "e.g.h"].forEach(function (topic) {
                config1.on(topic, function (k, v) {
                    res.push([topic, k, v]);
                });
            });
            assert.deepEqual(config1.loadSync(), conf1);
            process.nextTick(function () {
                assert.deepEqual(res, [
                    ["a", "a", 1],
                    ["b.c", "b.c", 1],
                    ["b", "b", {"c":1, "d":2}],
                    ["e.f", "e.f", 3],
                    ["e.g.h", "e.g.h", 4],
                    ["e.g", "e.g", {"h":4}],
                    ["e", "e", {"f":3, "g":{"h":4}}]
                ]);
                next();
            });
        });

        it.describe("with an env", function (it) {
            it.should("from directories", function () {
                var configDev = goFigure({environment:"development", locations:[__dirname + "/configs/config-env"]});
                var configProd = goFigure({environment:"production", locations:[__dirname + "/configs/config-env"]});
                var configTest = goFigure({environment:"test", locations:[__dirname + "/configs/config-env"]});
                assert.deepEqual(configDev.loadSync(), envConf.development);
                assert.deepEqual(configProd.loadSync(), envConf.production);
                assert.deepEqual(configTest.loadSync(), envConf.test);
            });

            it.should("from files", function () {
                var configDev = goFigure({environment:"development", files:[__dirname + "/configs/config-env/config.json"]});
                var configProd = goFigure({environment:"production", files:[__dirname + "/configs/config-env/config.json"]});
                var configTest = goFigure({environment:"test", files:[__dirname + "/configs/config-env/config.json"]});
                assert.deepEqual(configDev.loadSync(), envConf.development);
                assert.deepEqual(configProd.loadSync(), envConf.production);
                assert.deepEqual(configTest.loadSync(), envConf.test);
            });
        });
    });

    it.describe("#on", function (it) {
        it.should("monitor configurations in certain directories", function (next) {
            var config1 = goFigure({monitor:true, locations:[__dirname + "/configs/configs1"]});
            config1.loadSync();
            var res = [], called = 0;
            ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                config1.on(topic, function (key, val, config) {
                    called++;
                    res.push({key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                });
            })
            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 1],
                [comb.deepMerge({}, conf1, {b:{c:5}}), 2],
                [comb.deepMerge({}, conf1, {b:{d:7}}), 2],
                [comb.deepMerge({}, conf1, {e:{f:8}}), 2],
                [comb.deepMerge({}, conf1, {e:{g:{h:9}}}), 3]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4},
                        {key:"a", val:1},
                        {key:"b.c", val:5},
                        {key:"b.c", val:1},
                        {key:"b.d", val:7},
                        {key:"b.d", val:2},
                        {key:"e", val:{f:8, g:{h:4}}},
                        {key:"e.g.h", val:9},
                        {key:"e.g", val:{h:9}},
                        {key:"e", val:{f:3, g:{h:9}}}
                    ]);
                    next();
                }
            })(0);


        });

        it.should("monitor configurations of files", function (next) {
            var config1 = goFigure({monitor:true, files:[__dirname + "/configs/configs1/config1.json"]});
            config1.loadSync();
            var res = [], called = 0;
            ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                config1.on(topic, function (key, val, config) {
                    called++;
                    res.push({key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                });
            })
            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 1],
                [comb.deepMerge({}, conf1, {b:{c:5}}), 2],
                [comb.deepMerge({}, conf1, {b:{d:7}}), 2],
                [comb.deepMerge({}, conf1, {e:{f:8}}), 2],
                [comb.deepMerge({}, conf1, {e:{g:{h:9}}}), 3]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4},
                        {key:"a", val:1},
                        {key:"b.c", val:5},
                        {key:"b.c", val:1},
                        {key:"b.d", val:7},
                        {key:"b.d", val:2},
                        {key:"e", val:{f:8, g:{h:4}}},
                        {key:"e.g.h", val:9},
                        {key:"e.g", val:{h:9}},
                        {key:"e", val:{f:3, g:{h:9}}}
                    ]);
                    next();
                }
            })(0);


        });

        it.should("monitor configurations of certain files", function (next) {
            var config1 = goFigure({monitor:false, files:[
                {monitor:true, file:__dirname + "/configs/configs1/config1.json"}
            ]});
            config1.loadSync();
            var res = [], called = 0;
            ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                config1.on(topic, function (key, val, config) {
                    called++;
                    res.push({key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                });
            })
            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 1],
                [comb.deepMerge({}, conf1, {b:{c:5}}), 2],
                [comb.deepMerge({}, conf1, {b:{d:7}}), 2],
                [comb.deepMerge({}, conf1, {e:{f:8}}), 2],
                [comb.deepMerge({}, conf1, {e:{g:{h:9}}}), 3]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4},
                        {key:"a", val:1},
                        {key:"b.c", val:5},
                        {key:"b.c", val:1},
                        {key:"b.d", val:7},
                        {key:"b.d", val:2},
                        {key:"e", val:{f:8, g:{h:4}}},
                        {key:"e.g.h", val:9},
                        {key:"e.g", val:{h:9}},
                        {key:"e", val:{f:3, g:{h:9}}}
                    ]);
                    next();
                }
            })(0);


        });

        it.describe("with an env", function (it) {
            it.should("monitor configurations of files", function (next) {
                var res = [], called = 0;
                ["development", "production", "test"].forEach(function (env) {
                    var config = goFigure({monitor:true, environment:env, files:[__dirname + "/configs/config-env/config.json"]});
                    config.loadSync();
                    ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                        config.on(topic, function (key, val, config) {
                            called++;
                            res.push({env : env, key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                        });
                    })
                });
                var changes = [
                    [comb.deepMerge({}, envConf, {development:{a:6}, production:{a:11}, test:{a:16}}), 3],
                    [comb.deepMerge({}, envConf, {development:{b:{c:7}}, production:{b:{c:12}}, test:{b:{c:17}}}), 6],
                    [comb.deepMerge({}, envConf, {development:{b:{d:8}}, production:{b:{d:13}}, test:{b:{d:18}}}), 2],
                    [comb.deepMerge({}, envConf, {development:{e:{f:9}}, production:{e:{f:14}}, test:{e:{f:19}}}), 2],
                    [comb.deepMerge({}, envConf, {development:{e:{g:{h:10}}}, production:{e:{g:{h:15}}}, test:{e:{g:{h:20}}}}), 3]
                ];
                var l = changes.length;
                (function _next(index) {
                    if (index < l) {
                        fs.writeFile(__dirname + "/configs/config-env/config.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                            if (err) {
                                next(err);
                            } else {
                                (function to() {
                                    process.nextTick(function () {
                                        if (called >= changes[index][1]) {
                                            called = 0;
                                            _next(++index);
                                        } else {
                                            to();
                                        }
                                    });
                                })();
                            }
                        });
                    } else {
                        assert.deepEqual(res, [
                            {"env":"development", "key":"a", "val":6},
                            {"env":"production", "key":"a", "val":11},
                            {"env":"test", "key":"a", "val":16},
                            {"env":"development", "key":"a", "val":1},
                            {"env":"development", "key":"b.c", "val":7},
                            {"env":"production", "key":"a", "val":6},
                            {"env":"production", "key":"b.c", "val":12},
                            {"env":"test", "key":"a", "val":11},
                            {"env":"test", "key":"b.c", "val":17},
                            {"env":"development", "key":"b.c", "val":2},
                            {"env":"development", "key":"b.d", "val":8},
                            {"env":"production", "key":"b.c", "val":7},
                            {"env":"production", "key":"b.d", "val":13},
                            {"env":"test", "key":"b.c", "val":12},
                            {"env":"test", "key":"b.d", "val":18},
                            {"env":"development", "key":"b.d", "val":3},
                            {"env":"development", "key":"e", "val":{"f":9, "g":{"h":5}}},
                            {"env":"production", "key":"b.d", "val":8},
                            {"env":"production", "key":"e", "val":{"f":14, "g":{"h":10}}},
                            {"env":"test", "key":"b.d", "val":13},
                            {"env":"test", "key":"e", "val":{"f":19, "g":{"h":15}}},
                            {"env":"development", "key":"e.g.h", "val":10},
                            {"env":"development", "key":"e.g", "val":{"h":10}},
                            {"env":"development", "key":"e", "val":{"f":4, "g":{"h":10}}},
                            {"env":"production", "key":"e.g.h", "val":15},
                            {"env":"production", "key":"e.g", "val":{"h":15}},
                            {"env":"production", "key":"e", "val":{"f":9, "g":{"h":15}}},
                            {"env":"test", "key":"e.g.h", "val":20},
                            {"env":"test", "key":"e.g", "val":{"h":20}},
                            {"env":"test", "key":"e", "val":{"f":14, "g":{"h":20}}}
                        ]);
                        next();
                    }
                })(0);
            });
        });
    });


    it.describe("#addListener", function (it) {
        it.should("monitor configurations in certain directories", function (next) {
            var config1 = goFigure({monitor:true, locations:[__dirname + "/configs/configs1"]});
            config1.loadSync();
            var res = [], called = 0;
            ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                config1.addListener(topic, function (key, val, config) {
                    called++;
                    res.push({key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                });
            })
            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 1],
                [comb.deepMerge({}, conf1, {b:{c:5}}), 2],
                [comb.deepMerge({}, conf1, {b:{d:7}}), 2],
                [comb.deepMerge({}, conf1, {e:{f:8}}), 2],
                [comb.deepMerge({}, conf1, {e:{g:{h:9}}}), 3]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4},
                        {key:"a", val:1},
                        {key:"b.c", val:5},
                        {key:"b.c", val:1},
                        {key:"b.d", val:7},
                        {key:"b.d", val:2},
                        {key:"e", val:{f:8, g:{h:4}}},
                        {key:"e.g.h", val:9},
                        {key:"e.g", val:{h:9}},
                        {key:"e", val:{f:3, g:{h:9}}}
                    ]);
                    next();
                }
            })(0);


        });

        it.should("monitor configurations of files", function (next) {
            var config1 = goFigure({monitor:true, files:[__dirname + "/configs/configs1/config1.json"]});
            config1.loadSync();
            var res = [], called = 0;
            ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                config1.addListener(topic, function (key, val, config) {
                    called++;
                    res.push({key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                });
            })
            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 1],
                [comb.deepMerge({}, conf1, {b:{c:5}}), 2],
                [comb.deepMerge({}, conf1, {b:{d:7}}), 2],
                [comb.deepMerge({}, conf1, {e:{f:8}}), 2],
                [comb.deepMerge({}, conf1, {e:{g:{h:9}}}), 3]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4},
                        {key:"a", val:1},
                        {key:"b.c", val:5},
                        {key:"b.c", val:1},
                        {key:"b.d", val:7},
                        {key:"b.d", val:2},
                        {key:"e", val:{f:8, g:{h:4}}},
                        {key:"e.g.h", val:9},
                        {key:"e.g", val:{h:9}},
                        {key:"e", val:{f:3, g:{h:9}}}
                    ]);
                    next();
                }
            })(0);


        });

        it.should("monitor configurations of certain files", function (next) {
            var config1 = goFigure({monitor:false, files:[
                {monitor:true, file:__dirname + "/configs/configs1/config1.json"}
            ]});
            config1.loadSync();
            var res = [], called = 0;
            ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                config1.addListener(topic, function (key, val, config) {
                    called++;
                    res.push({key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                });
            })
            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 1],
                [comb.deepMerge({}, conf1, {b:{c:5}}), 2],
                [comb.deepMerge({}, conf1, {b:{d:7}}), 2],
                [comb.deepMerge({}, conf1, {e:{f:8}}), 2],
                [comb.deepMerge({}, conf1, {e:{g:{h:9}}}), 3]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4},
                        {key:"a", val:1},
                        {key:"b.c", val:5},
                        {key:"b.c", val:1},
                        {key:"b.d", val:7},
                        {key:"b.d", val:2},
                        {key:"e", val:{f:8, g:{h:4}}},
                        {key:"e.g.h", val:9},
                        {key:"e.g", val:{h:9}},
                        {key:"e", val:{f:3, g:{h:9}}}
                    ]);
                    next();
                }
            })(0);


        });

        it.describe("with an env", function (it) {
            it.should("monitor configurations of files", function (next) {
                var res = [], called = 0;
                ["development", "production", "test"].forEach(function (env) {
                    var config = goFigure({monitor:true, environment:env, files:[__dirname + "/configs/config-env/config.json"]});
                    config.loadSync();
                    ["a", "b.{c|d}", "e", "e.g", "e.g.*"].forEach(function(topic){
                        config.addListener(topic, function (key, val, config) {
                            called++;
                            res.push({env : env, key:key, val:comb.isObject(val) ? comb.deepMerge({}, val) : val});
                        });
                    })
                });
                var changes = [
                    [comb.deepMerge({}, envConf, {development:{a:6}, production:{a:11}, test:{a:16}}), 3],
                    [comb.deepMerge({}, envConf, {development:{b:{c:7}}, production:{b:{c:12}}, test:{b:{c:17}}}), 6],
                    [comb.deepMerge({}, envConf, {development:{b:{d:8}}, production:{b:{d:13}}, test:{b:{d:18}}}), 2],
                    [comb.deepMerge({}, envConf, {development:{e:{f:9}}, production:{e:{f:14}}, test:{e:{f:19}}}), 2],
                    [comb.deepMerge({}, envConf, {development:{e:{g:{h:10}}}, production:{e:{g:{h:15}}}, test:{e:{g:{h:20}}}}), 3]
                ];
                var l = changes.length;
                (function _next(index) {
                    if (index < l) {
                        fs.writeFile(__dirname + "/configs/config-env/config.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                            if (err) {
                                next(err);
                            } else {
                                (function to() {
                                    process.nextTick(function () {
                                        if (called >= changes[index][1]) {
                                            called = 0;
                                            _next(++index);
                                        } else {
                                            to();
                                        }
                                    });
                                })();
                            }
                        });
                    } else {
                        assert.deepEqual(res, [
                            {"env":"development", "key":"a", "val":6},
                            {"env":"production", "key":"a", "val":11},
                            {"env":"test", "key":"a", "val":16},
                            {"env":"development", "key":"a", "val":1},
                            {"env":"development", "key":"b.c", "val":7},
                            {"env":"production", "key":"a", "val":6},
                            {"env":"production", "key":"b.c", "val":12},
                            {"env":"test", "key":"a", "val":11},
                            {"env":"test", "key":"b.c", "val":17},
                            {"env":"development", "key":"b.c", "val":2},
                            {"env":"development", "key":"b.d", "val":8},
                            {"env":"production", "key":"b.c", "val":7},
                            {"env":"production", "key":"b.d", "val":13},
                            {"env":"test", "key":"b.c", "val":12},
                            {"env":"test", "key":"b.d", "val":18},
                            {"env":"development", "key":"b.d", "val":3},
                            {"env":"development", "key":"e", "val":{"f":9, "g":{"h":5}}},
                            {"env":"production", "key":"b.d", "val":8},
                            {"env":"production", "key":"e", "val":{"f":14, "g":{"h":10}}},
                            {"env":"test", "key":"b.d", "val":13},
                            {"env":"test", "key":"e", "val":{"f":19, "g":{"h":15}}},
                            {"env":"development", "key":"e.g.h", "val":10},
                            {"env":"development", "key":"e.g", "val":{"h":10}},
                            {"env":"development", "key":"e", "val":{"f":4, "g":{"h":10}}},
                            {"env":"production", "key":"e.g.h", "val":15},
                            {"env":"production", "key":"e.g", "val":{"h":15}},
                            {"env":"production", "key":"e", "val":{"f":9, "g":{"h":15}}},
                            {"env":"test", "key":"e.g.h", "val":20},
                            {"env":"test", "key":"e.g", "val":{"h":20}},
                            {"env":"test", "key":"e", "val":{"f":14, "g":{"h":20}}}
                        ]);
                        next();
                    }
                })(0);
            });
        });
    });

    it.describe("#once", function (it) {
        it.should("should stop listening", function (next) {
            var config1 = goFigure({monitor:true, locations:[__dirname + "/configs/configs1"]});
            config1.loadSync();
            var res = [], called = 0;
            var l1 = function (key, val, config) {
                called++;
                res.push({key:key, val:val, l:"l1"})
            };

            var l2 = function (key, val, config) {
                called++;
                res.push({key:key, val:val, l:"l2"})
            };
            config1.once("a", l1);
            config1.on("a", l2);

            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 2],
                [comb.deepMerge({}, conf1, {a:1}), 1]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4) + "\n\r", function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4, l:"l1"},
                        {key:"a", val:4, l:"l2"},
                        {key:"a", val:1, l:"l2"}
                    ]);
                    next();
                }
            })(0);


        });

    });

    it.describe("#removeListener", function (it) {
        it.should("should stop listening", function (next) {
            var config1 = goFigure({monitor:true, locations:[__dirname + "/configs/configs1"]});
            config1.loadSync();
            var res = [], called = 0;
            var l1 = function (key, val, config) {
                called++;
                res.push({key:key, val:val, l:"l1"})
            };

            var l2 = function (key, val, config) {
                called++;
                res.push({key:key, val:val, l:"l2"})
            };
            config1.on("a", l1);
            config1.on("a", l2);

            var changes = [
                [comb.deepMerge({}, conf1, {a:4}), 2],
                [comb.deepMerge({}, conf1, {a:1}), 1]
            ];
            var l = changes.length;
            (function _next(index) {
                if (index < l) {
                    fs.writeFile(__dirname + "/configs/configs1/config1.json", JSON.stringify(changes[index][0], null, 4), function (err, res) {
                        if (err) {
                            next(err);
                        } else {
                            (function to() {
                                process.nextTick(function () {
                                    if (called >= changes[index][1]) {
                                        config1.removeListener("a", l1);
                                        called = 0;
                                        _next(++index);
                                    } else {
                                        to();
                                    }
                                });
                            })();
                        }
                    });
                } else {
                    assert.deepEqual(res, [
                        {key:"a", val:4, l:"l1"},
                        {key:"a", val:4, l:"l2"},
                        {key:"a", val:1, l:"l2"}
                    ]);
                    next();
                }
            })(0);


        });

    });
    it.run();
})
;

