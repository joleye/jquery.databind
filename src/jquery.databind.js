require(['jquery'], function () {
    $.fn.databind = function (act, opt) {
        this.conf = {
            act: act,
            url: $(this).data('url'),
            page_size: $(this).data('page_size'),
            tpl: $(this).data('tpl'),
            method: $(this).data('method') || 'POST',
            children: $(this).data('children'),
            param: $(this).data('param') || {},
            afterCreate: $(this).data('after_create') || null
        };

        this.conf = $.extend(this.conf, opt);

        var def = {
            page_size: this.conf.page_size,
            response: 'JSON'
        };
        this.params = $.extend(def, this.conf.param);

        if (!this.conf.url) {
            if (this.conf.rows) {
                $(this).empty();
                bind(this.conf.rows, get_tpl_text(this), this, this.conf.children, 0);
            }
            $(this).databindValue(this.conf);
        } else if (this.conf.url) {
            ajax.apply(this);
        } else {
            $(this).databindValue(this.conf);
        }
    };

    function ajax(cb) {
        var that = this;
        $.ajax({
            type: this.conf.method,
            url: this.conf.url,
            data: this.params,
            success: function (res) {
                if (res.status) {
                    var tpl_text = get_tpl_text(that);
                    if ('reload' == that.conf.act) {
                        $(that).empty();
                    }
                    bind(res.rows, tpl_text, that, that.conf.children, 0);
                    $(that).databindValue(that.conf);
                }
            }
        });
    }

    function get_tpl_text(that) {
        var tpl_text;
        if (that.conf.tpl) {
            tpl_text = $('#' + that.conf.tpl).html();
        } else {
            tpl_text = $(that).html();
            $(that).html('');
        }
        return tpl_text;
    }

    function bind(rows, tpl_text, that, children, depth) {
        if (rows) {
            $.each(rows, function (key, val) {
                var html = tpl_text;
                var mat = html.match(/\$\{[\w\|]+\}/g);
                if (mat) {
                    mat.forEach(function (pat) {
                        var key = pat.replace(/\$\{|\}/g, '');
                        var targetValue;
                        if (key.indexOf('||') > -1) {
                            var keyArr = key.split('||');
                            if (keyArr.length > 1) {
                                if (val[keyArr[0]]) {
                                    targetValue = val[keyArr[0]];
                                } else {
                                    targetValue = val[keyArr[1]];
                                }
                            }
                        } else {
                            targetValue = val[key];
                        }
                        html = html.replace(pat, targetValue != undefined ? targetValue : '');
                    });
                }
                if (html.indexOf('@{depth}') > -1) {
                    var reg = new RegExp('@{depth}', 'g');
                    html = html.replace(reg, getDepth(depth));
                }
                if (html.indexOf('@{this}') > -1) {
                    var reg = new RegExp('@{this}', 'g');
                    html = html.replace(reg, val.trim());
                }
                $(html).appendTo($(that)).data('row', val);
                if (children && val[children]) {
                    bind(val[children], tpl_text, that, children, depth + 1);
                }
            });
        }
    }

    function getDepth(depth) {
        var str = '|----|----|----|----|----|----|----|----|----|----';
        return str.substring(0, depth * 5);
    }

    $.fn.databindValue = function (conf) {
        var val = $(this).data('value');
        var afterCreate = $(this).data('after_create') || conf.afterCreate || null;
        if (typeof val != 'undefined' && val != null && val != '') {
            var databindCreate = $(this).data('databind_create');
            if(databindCreate){
                window[databindCreate].apply(this);
            }else {
                var arr = (val + '').split(',');
                var $this = $(this);
                $.each(arr, function (i, v) {
                    $this.val(v).trigger('select');
                    $this.find('input[type=radio][value=' + v + ']').prop('checked', true);
                    $this.find('input[type=checkbox][value=' + v + ']').prop('checked', true);
                });
            }
        }

        if (typeof afterCreate == 'function') {
            afterCreate.apply(this);
        } else if (afterCreate) {
            window[afterCreate].apply(this);
        }
    };

    var runners = [];

    $('.databind').each(function () {
        runners.push(this);
    });

    runner(0);

    function runner(i) {
        if (i < runners.length) {
            var that = runners[i];
            $(that).databind();
            setTimeout(function () {
                runner(i + 1);
            }, 10);
        }
    }

});
