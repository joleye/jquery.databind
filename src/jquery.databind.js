/**
 * v0.2.1 初始版本
 * https://github.com/joleye/jquery.databind.git
 * @author lee.zhang
 */
function jquery_databind() {
    /**
     * 入口
     * @param act 方法 load, reload, model(绑定)
     * @param opt 选项
     * @param interval 重新加载倒计时
     */
        //全局id
    var global_databind_id = 0;

    //调试标记
    var debug = 0;

    $.fn.databind = function (act, opt, interval) {
        if (this.length === 0) {
            return;
        }
        this.conf = {
            act: act,
            interval: interval,
            url: $(this).data('url'),
            page_size: $(this).data('page_size'),
            tpl: $(this).data('tpl'),
            none_tpl: $(this).data('none_tpl') || null,
            method: $(this).data('method') || 'POST',
            children: $(this).data('children'),
            param: $(this).data('param') || {},
            afterCreate: $(this).data('after_create') || null,
            beforeCreate: $(this).data('before_create') || null,
            itemAfterCreate: $(this).data('item_before_create') || null,
            page: $(this).data('page') || null,
            pageClick: $(this).data('page_click') || null,
            fail: $(this).data('fail') || null,
            rigorous: false
        };

        this.conf = $.extend(this.conf, opt);
        this.conf.id = global_databind_id;
        debug && console.log('---', this.conf.id);
        global_databind_id++;

        var _databind_conf = $(this).data('_databind_conf');
        if (_databind_conf) {
            this.conf = $.extend(_databind_conf, this.conf);
        }

        $(this).data('_databind_conf', this.conf);

        var def = {
            page_size: this.conf.page_size,
            response: 'JSON'
        };
        this.params = $.extend(def, this.conf.param);

        if (!this.conf.url) {
            if (this.conf.rows && this.conf.rows.length > 0) {
                if ('reload' === this.conf.act) {
                    $(this).empty();
                }
                if ('model' === this.conf.act) {
                    bindModel({rows: this.conf.rows}, this, this.conf);
                    return;
                }
                bind(this.conf.rows, getTplText(this), this, this.conf, 0);
            } else {
                bindNone(this);
            }
            $(this).databindValue(this.conf);
        } else if (this.conf.url) {
            ajax.apply(this);
        } else {
            $(this).databindValue(this.conf);
        }

        if (interval) {
            var that = this;
            setTimeout(function () {
                $(that).databind('reload', opt, interval);
            }, interval);
        }
    };

    function ajax() {
        var that = this;
        $.ajax({
            type: this.conf.method,
            url: this.conf.url,
            data: this.params,
            success: function (res) {
                if (res.status) {
                    if ('model' === that.conf.act) {
                        bindModel(res, that, that.conf);
                        return;
                    }
                    var tpl_text = getTplText(that);
                    if ('reload' === that.conf.act) {
                        $(that).empty();
                    }
                    bind(res.rows, tpl_text, that, that.conf, 0);
                    $(that).databindValue(that.conf);

                    //分页相关
                    if (that.conf.page) {
                        var id = that.conf.page.id;
                        var prevText = that.conf.page.prevText || '上一页';
                        var nextText = that.conf.page.nextText || '上一页';

                        var pageStr = '<a href="javascript:void(0);" class="pageBtn" data-no="-1">' + prevText + '</a>' +
                            '<span class="pageNo">' + res.data.pageNo + '</span>' +
                            '<span>/</span>' +
                            '<span class="totalPage">' + res.data.pageCount + '</span>' +
                            '<a href="javascript:void(0);" class="pageBtn" data-no="1">' + nextText + '</a>';

                        $('#' + id).empty().append(pageStr).find('a').on('click', function () {
                            var step = parseInt($(this).data('no'));
                            var pageNo = res.data.pageNo + step;
                            if (pageNo < 1) {
                                pageNo = 1;
                            }
                            if (pageNo > res.data.pageCount) {
                                pageNo = res.data.pageCount;
                            }
                            that.conf.pageClick(pageNo);
                        });
                    }
                } else if (that.conf.fail) {
                    that.conf.fail(res);
                    if (that.conf.complete) {
                        that.conf.complete(res);
                    }
                }else{
                    if (that.conf.complete) {
                        that.conf.complete(res);
                    }
                }
            }
        });
    }

    function getTplText(that) {
        var tpl_text;
        var tpl_id = that.conf.tpl;
        if (tpl_id) {
            tpl_text = $('#' + tpl_id).html();
        } else {
            tpl_text = $(that).html();
            $(that).html('');
        }
        return tpl_text;
    }

    function bind(rows, tpl_text, that, options, depth) {
        var children = options.children;
        if (rows && ((rows instanceof Array && rows.length > 0 ) || (typeof rows === 'object' && Object.keys(rows).length > 0))) {
            var index = 1;
            $.each(rows, function (key, val) {
                if (typeof options.beforeCreate == 'function') {
                    options.beforeCreate(val, index);
                } else if (window[options.beforeCreate]) {
                    window[options.beforeCreate](val, index)
                }
                val['$index'] = index;
                var html = getCommonTpl(tpl_text, key, val, '\\$', depth, index++);
                var $item = $(html).appendTo($(that)).data('row', val);
                bindEvent($item, val);
                if (typeof options.itemAfterCreate == 'function') {
                    options.itemAfterCreate.call($item, val, index);
                }
                if (children && val[children]) {
                    bind(val[children], tpl_text, that, options, depth + 1);
                }
            });
            if (options.success) {
                options.success(rows);
            }
        } else {
            bindNone(that);
        }
        // if (options.complete) {
        //     options.complete(rows);
        // }
    }

    function bindNone(that) {
        var tpl_id = that.conf.none_tpl;
        if (tpl_id) {
            var html = $('#' + tpl_id).html();
            $(html).appendTo($(that));
        }
    }

    function bindModel(res, that, options) {
        var rows = res.rows;
        if (rows && rows.length > 0) {
            $.each(rows, function (key, val) {
                $.each(val, function (k1, v1) {
                    if (v1 == null) {
                    } else if (typeof v1 == 'object') {
                        $.each(v1, function (k2, v2) {
                            $(that).find('[name=' + k1 + ']').find('[name=' + k2 + ']').databindValue(options, v2);
                        });
                    } else {
                        $(that).find('[name=' + k1 + ']').databindValue(options, v1);
                    }
                });
            });
            if (options.success) {
                options.success(rows, res);
            }
        } else {
            bindNone(that);
        }
        if (options.complete) {
            options.complete(rows, res);
        }
    }

    function getCommonTpl(tpl_text, key, val, headTag, depth, index) {
        var html = tpl_text;
        if (!html) {
            return '';
        }
        var regGlobal = new RegExp(headTag + '\\{[\\w\\|\\.]+\\}', 'g');
        var mat = html.match(regGlobal);
        if (mat) {
            mat.forEach(function (pat) {
                var reg = new RegExp(headTag + '\\{|\\}', 'g');
                var matKey = pat.replace(reg, '');
                var targetValue;
                if (matKey.indexOf('||') > -1) {
                    var keyArr = matKey.split('||');
                    if (keyArr.length > 1) {
                        if (val[keyArr[0]]) {
                            targetValue = val[keyArr[0]];
                        } else {
                            targetValue = val[keyArr[1]];
                        }
                    }
                } else if (matKey.indexOf('.') > -1) {
                    var keyArrD = matKey.split('.');
                    if (keyArrD.length > 1) {
                        if (val[keyArrD[0]]) {
                            targetValue = val[keyArrD[0]][keyArrD[1]];
                        }
                    } else {
                        targetValue = val[matKey];
                    }
                } else {
                    targetValue = val[matKey];
                }
                html = html.replace(pat, targetValue !== undefined ? targetValue : '');
            });
        }
        if (html.indexOf('@{depth}') > -1) {
            var reg = new RegExp('@{depth}', 'g');
            html = html.replace(reg, getDepth(depth));
        }
        if (html.indexOf('@{index}') > -1) {
            var reg = new RegExp('@{index}', 'g');
            html = html.replace(reg, index);
        }
        if (html.indexOf('@{this}') > -1) {
            var reg = new RegExp('@{this}', 'g');
            html = html.replace(reg, val.trim());
        }
        return html;
    }

    function bindEvent($this, data) {
        bindAct('d-if', $this, data);
        bindAct('d-for', $this, data);
    }

    function bindAct(attr, $this, data) {
        if ($this.attr(attr)) {
            var attrValue = $this.attr(attr);
            act[attr]($this, data, attrValue);
        }
        $this.find('[' + attr + ']').each(function () {
            var attrValue = $(this).attr(attr);
            act[attr]($(this), data, attrValue);
        });
    }

    var act = {
        'd-if': function ($this, data, attrValue) {
            var size = data != null && Object.keys(data).length;
            var is_ok = (new Function("", stringify(data) + ";$size=" + size + ";return " + attrValue))();
            if (!is_ok) {
                $this.remove();
            }
            $this.removeAttr('d-if');
        },
        'd-for': function ($this, data, attrValue) {
            var treeData = data[attrValue.trim()];
            if (treeData instanceof Array) {
                var index = 1;
                $.each(treeData, function (i, val) {
                    var tpl_text = $this.prop("outerHTML");
                    var html = getCommonTpl(tpl_text, i, val, '\\#', null, index++);
                    var $item = $(html).appendTo($this.parent()).data('row', val);
                    $item.removeAttr('d-for');
                });
                $this.remove();
            }
        }
    };

    function stringify(data) {
        var line = [];
        $.each(data, function (k, val) {
            var actual_val = null;
            if (typeof val == 'string') {
                actual_val = '"' + val + '"';
            } else if (val == null) {
                actual_val = val;
            } else if (val === '') {
                actual_val = '""';
            } else if (val instanceof Array) {
                actual_val = JSON.stringify(val);
            } else if (typeof val == 'object') {
                console.log('not support ->' + (typeof val) + ' ' + val);
                return;
            } else {
                actual_val = val;
            }
            line.push('var ' + k + '=' + actual_val);
        });
        return line.join(';');
    }

    function getDepth(depth) {
        var str = '|----|----|----|----|----|----|----|----|----|----';
        return str.substring(0, depth * 5);
    }

    $.fn.findValue = function (value) {
        var ret = [];
        this.each(function () {
            if ($(this).val() === value) {
                ret.push(this);
            }
        });
        return new $(ret);
    };

    function isInput($this) {
        if ($this.length > 0) {
            var that = $this[0];
            var nodeName = that.nodeName.toLowerCase();
            var nodeType = $this.attr('type');
            return /input|textarea/.test(nodeName) && /text|hidden/.test(nodeType);
        } else {
            return false;
        }
    }

    $.fn.databindValue = function (conf, value) {
        debug && console.log('+++', conf.id, conf, value);
        var originalValue = $(this).data('value');
        var val = null;
        if (typeof originalValue !== 'undefined') {
            val = originalValue;
        } else {
            val = value;
        }
        var afterCreate = $(this).data('after_create') || conf.afterCreate || null;
        var is_bind = false;
        if(conf.rigorous){
            is_bind = conf.rigorous;
        }else{
            is_bind = val != null && val !== '';
        }
        if (typeof val != 'undefined' && is_bind) {
            var databindCreate = $(this).data('databind_create');
            if (databindCreate) {
                window[databindCreate] && window[databindCreate].apply(this);
            } else {
                var $this = $(this);
                if (isInput($this)) {
                    $this.val(val);
                } else {
                    var arr = (val + '').split(',');
                    var nodeName = $this.length > 0 ? $this[0].nodeName.toLowerCase() : '';
                    $.each(arr, function (i, v) {
                        if (nodeName === 'select') {
                            $this.find('option').findValue(v).prop('selected', true);
                        } else {
                            $this.val(v).trigger('select');
                            $this.find('input[type=radio]').findValue(v).prop('checked', true);
                            $this.find('input[type=checkbox]').findValue(v).prop('checked', true);
                        }
                    });
                }
            }
        }

        if (typeof afterCreate == 'function') {
            afterCreate.apply(this);
        } else if (afterCreate) {
            if (typeof afterCreate == 'function') {
                afterCreate.apply(this);
            } else {
                window[afterCreate] && window[afterCreate].apply(this);
            }
        }

        if (conf.complete) {
            conf.complete(value);
        }
    };

    //全局回调方法
    var readyCallback = [];

    //全局回调入口
    $.databindReady = function (callback) {
        readyCallback.push(callback);
    };

    $(document).ready(function () {
        var runners = [];

        var $globalDatabind = $('.databind');

        var completeCnt = $globalDatabind.length;
        var globalOpt = {
            complete: function () {
                completeCnt--;
                debug && console.log('completeCnt', completeCnt);
                if (completeCnt === 0) {
                    for (var i in readyCallback) {
                        readyCallback[i]();
                    }
                }
            }
        };

        $globalDatabind.each(function () {
            var wait = typeof $(this).data('wait') != 'undefined' ? $(this).data('wait') : 10;
            if (wait > 0) {
                runners.push({value: this, wait: wait});
            } else {
                $(this).databind('load', globalOpt);
            }
        });

        runner(0);

        function runner(i) {
            if (i < runners.length) {
                var that = runners[i];
                $(that.value).databind('load', globalOpt);
                setTimeout(function () {
                    runner(i + 1);
                }, that.wait);
            }
        }
    });
}

if (typeof define != 'undefined') {
    define(['jquery'], jquery_databind);
} else if (typeof $ != 'undefined') {
    jquery_databind();
}
