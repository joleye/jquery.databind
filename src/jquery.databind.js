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
        } else {
            ajax.apply(this);
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
                    $(that).databindValue();
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
            if (that.conf && that.conf.afterCreate) {
                that.conf.afterCreate.apply(that);
            }
        }
    }

    function getDepth(depth) {
        var str = '|----|----|----|----|----|----|----|----|----|----';
        return str.substring(0, depth * 5);
    }

    $.fn.databindValue = function () {
        var val = $(this).data('value');
        $(this).val(val).trigger('select');
        $(this).find('input[type=radio][value=' + val + ']').prop('checked', true);
    };

    var runners = [];

    $('.databind').each(function () {
        if ($(this).attr('data-value')) {
            $(this).databindValue();
        }
        runners.push(this);
    });

    runner(0);

    function runner(i) {
        if (i < runners.length) {
            var that = runners[i];
            $(that).databind();
            setTimeout(function () {
                runner(i + 1);
            }, 200);
        }
    }

});