### this is jquery databind plugs

## 属性，第一个参数
act: load, reload, model(绑定)

## 属性，第二个参数
| 方法 | 类型 | 说明 |
|:----|----|:----|
|interval|int| 重新加载倒计时
|wait|int|延迟时间，单位毫秒，默认10毫秒
|url|string|数据接口地址
|tpl|string|模板id
|none_tpl|string|未找到数据模板id
|method|string|请求方法，GET、POST，默认POST
|param|json|数据接口请求参数
|rigorous|bool|强制标准
|afterCreate|function|接口回调方法，注意：html里面为data-after_create|
|beforeCreate|function|创建之前回调方法，注意：html里面为data-before_create|
|itemAfterCreate|function|单行创建时候方法，注意：html里面为data-item_after_create|
|rows|json|手动设置数据|
|page|json|分页配置，格式:{id: 'pageBox', prevText: '上一页', nextText: '下一页'},|
|pageClick|function|分页按钮点击事件，参数1：当前页号，注意：html里面为data-page_click|
|fail|function|加载错误时调用|
|success|function|加载成功时调用|
|complete|function|加载完成时调用|


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
