"use strict";
//双向绑定
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bindingPack = exports.pack = exports.binding = void 0;
//<input value={binding(useState())}
const React = __importStar(require("react"));
function binding(state) {
    //把一个状态打包成link格式
    return {
        get value() {
            return state[0];
        },
        update(v) {
            state[1](v);
        }
    };
}
exports.binding = binding;
class CLS {
    constructor(c) {
        this.c = c;
        this.nowList = [];
    }
    build() {
        return bindingPack(this.c, this.nowList);
    }
    bind(key, updateEventName, getter) {
        this.nowList.push({
            key,
            updateEventName,
            getter
        });
        //在类型中删除key表示的属性
        return this;
    }
}
function pack(c) {
    // type Constructor<C>=C extends React.ComponentType<infer P>? (props:P)=>C:never;
    return new CLS(c);
}
exports.pack = pack;
function bindingPack(Comp, bindKeys) {
    //将制定的树形添加bind前缀属性
    //传入的是binding数组
    const prefix = 'bind-';
    let keys = bindKeys.map(v => typeof v == "string" ? { key: v } : v);
    let bkeys = keys.map(v => v.key);
    return (props) => {
        //bind前缀的属性 在keys中的
        let nprops = {};
        for (let k in props) {
            console.log(bkeys);
            if (k.startsWith(prefix) && bkeys.includes(k.slice(prefix.length))) {
                console.log(k);
                //是绑定属性
                //转换
                let rk = k.slice(prefix.length);
                let rv = props[k].value;
                nprops[rk] = rv;
                //添加事件
                //找到与当前属性一样的描述符 获取记录的事件名
                let desc = keys.find(v => v.key == rk);
                //默认使用onChange事件
                let eventname = desc.updateEventnName ?? "onInput";
                //添加事件
                console.log('aaa');
                function addEvent() {
                    nprops[eventname].funcs.push((...args) => {
                        //绑定事件 用来调用更新函数
                        let ent = props[k];
                        let val = args[0];
                        if (desc.getter != null) {
                            //有定义 提取
                            val = desc.getter(...args);
                        }
                        ent.update(val);
                    });
                }
                if (eventname in nprops) {
                    //已经有这个事件
                    addEvent();
                }
                else {
                    let hubfunc = (...args) => {
                        for (let a of hubfunc.funcs) {
                            //忽略返回值
                            a(...args);
                        }
                    };
                    hubfunc.funcs = [];
                    //nprops
                    nprops[eventname] = hubfunc;
                    //
                    addEvent();
                }
            }
            else {
                if (typeof props[k] == "function") {
                    if (k in nprops) {
                        //这里确定一定是函数了
                        if (typeof nprops[k] != "function") {
                            throw new Error();
                        }
                        else
                            nprops[k].funcs.push(props[k]);
                    }
                    else {
                        //创建集线器
                        let eventname = k;
                        let hubfunc = (...args) => {
                            for (let a of hubfunc.funcs) {
                                //忽略返回值
                                a(...args);
                            }
                        };
                        hubfunc.funcs = [];
                        //nprops
                        nprops[eventname] = hubfunc;
                        hubfunc.funcs.push(props[k]);
                    }
                }
                else {
                    if (k in nprops)
                        throw new Error("重复使用值属性");
                    nprops[k] = props[k];
                }
            }
        }
        console.log(nprops);
        return React.createElement(Comp, Object.assign({}, nprops));
    };
}
exports.bindingPack = bindingPack;
