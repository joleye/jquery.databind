/**
 * v0.1初始版本
 * @author lee.zhang
 */
define(['jquery'], function () {
    $.fn.databind = function (act, opt) {
        if(this.length === 0){
            return;
        }
        this.conf = {
            act: act,
            url: $(this).data('url'),
            page_size: $(this).data('page_size'),
            tpl: $(this).data('tpl'),
            method: $(this).data('method') || 'POST',
            children: $(this).data('children'),
            param: $(this).data('param') || {},
            afterCreate: $(this).data('after_create') || null,
            beforeCreate: $(this).data('before_create') || null,
            itemAfterCreate: $(this).data('item_before_create') || null
        };

        this.conf = $.extend(this.conf, opt);

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
            if (this.conf.rows) {
                if ('reload' === this.conf.act) {
                    $(this).empty();
                }
                bind(this.conf.rows, getTplText(this), this, this.conf, 0);
            }
            $(this).databindValue(this.conf);
        } else if (this.conf.url) {
            ajax.apply(this);
        } else {
            $(this).databindValue(this.conf);
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
                }
            }
        });
    }

    function getTplText(that) {
        var tpl_text;
        if (that.conf.tpl) {
            tpl_text = $('#' + that.conf.tpl).html();
        } else {
            tpl_text = $(that).html();
            $(that).html('');
        }
        return tpl_text;
    }

    function bind(rows, tpl_text, that, options, depth) {
        var children = options.children;
        if (rows) {
            var index = 1;
            $.each(rows, function (key, val) {
                if (typeof options.beforeCreate == 'function') {
                    options.beforeCreate(val, index);
                } else if (window[options.beforeCreate]) {
                    window[options.beforeCreate](val, index)
                }

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
        }
        if (options.complete) {
            options.complete(rows);
        }
    }

    function bindModel(res, that, options) {
        var rows = res.rows;
        if (rows) {
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
        }
        if (options.complete) {
            options.complete(rows, res);
        }
    }

    function getCommonTpl(tpl_text, key, val, headTag, depth, index) {
        var html = tpl_text;
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
                } else if(matKey.indexOf('.') > -1){
                    var keyArrD = matKey.split('.');
                    if (keyArrD.length > 1) {
                        if (val[keyArrD[0]]) {
                            targetValue = val[keyArrD[0]][keyArrD[1]];
                        }
                    }else{
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
            var is_ok = (new Function("", stringify(data) + ";return " + attrValue))();
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
        if($this.length > 0) {
            var that = $this[0];
            var nodeName = that.nodeName.toLowerCase();
            var nodeType = $this.attr('type');
            return /input|textarea/.test(nodeName) && /text|hidden/.test(nodeType);
        }else{
            return false;
        }
    }

    $.fn.databindValue = function (conf, value) {
        var originalValue = $(this).data('value');
        var val =  null;
        if(typeof originalValue !== 'undefined'){
            val = originalValue;
        }else{
            val = value;
        }
        var afterCreate = $(this).data('after_create') || conf.afterCreate || null;
        if (typeof val != 'undefined' && val != null && val !== '') {
            var databindCreate = $(this).data('databind_create');
            if (databindCreate) {
                window[databindCreate] && window[databindCreate].apply(this);
            } else {
                var $this = $(this);
                if(isInput($this)){
                    $this.val(val);
                }else{
                    var arr = (val + '').split(',');
                    var nodeName = $this.length > 0 ? $this[0].nodeName.toLowerCase() : '';
                    $.each(arr, function (i, v) {
                        if(nodeName === 'select'){
                            $this.find('option').findValue(v).prop('selected', true);
                        }else {
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
    };

    var runners = [];

    $('.databind').each(function () {
        var wait = typeof $(this).data('wait') != 'undefined' ? $(this).data('wait') : 10;
        if (wait > 0) {
            runners.push({value: this, wait: wait});
        } else {
            $(this).databind();
        }
    });

    runner(0);

    function runner(i) {
        if (i < runners.length) {
            var that = runners[i];
            $(that.value).databind();
            setTimeout(function () {
                runner(i + 1);
            }, that.wait);
        }
    }

});
