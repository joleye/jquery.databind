### this is jquery databind plugs


1.方法1

```html
<div class="data-container databind"
     data-url="dataUrl"
     data-tpl="usage"
     data-method="POST"
     data-param='{"startDate":"${param.start_date}","endDate":"${param.end_date}"}'
>
</div>
```

2. 方法2
```javascript
$('#complain-option').databind('load', {
    tpl:'tpl-id',//模板id
    rows: [],//data
    afterCreate: function () {
        $($('#option-other-tpl').html()).appendTo($(this));
    }
});

```

3. d-if 选择性显示
```html
<div d-if="status != null">
</div>
```

4. d-for 循环
```html
<div d-for="tree">
#{name}
</div>
```
