### this is jquery databind plugs

## 参数介绍
act: load, reload, model(绑定)

wait：延迟时间，单位毫秒，默认10毫秒

url：数据接口地址

tpl：模板id

none_tpl：未找到数据模板id

method：请求方法，GET、POST，默认POST

param：数据接口请求参数

afterCreate：接口回调方法，注意：html里面为data-after_create

beforeCreate：创建之前回调方法，注意：html里面为data-before_create

itemAfterCreate：单行创建时候方法，注意：html里面为data-item_after_create

rows：数据

## 内置变量
@{index} 行号，从1开始编号
@{depth} 深度，有子节点时有效，默认：--|
@{this} 当前节点值



## 使用方法
方法1

```html
<div class="data-container databind"
     data-url="dataUrl"
     data-tpl="usage"
     data-method="POST"
     data-after_create="afterCreate"
     data-param='{"startDate":"${param.start_date}","endDate":"${param.end_date}"}'
     data-wait="10"
>
</div>

```

方法2
```javascript
$('#complain-option').databind('load', {
    tpl:'tpl-id',//模板id
    rows: [],//data
    afterCreate: function () {
        $($('#option-other-tpl').html()).appendTo($(this));
    }
});

```

## 表达式
d-if 选择性显示
```html
<div d-if="status != null">
</div>
```

d-for 循环
```html
<div d-for="tree">
#{name}
</div>
```
