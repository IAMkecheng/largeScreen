
let tab_charts_arr = {}, overall_data = {}, current_indicator_global = ''

// load data
document.getElementById('upload').addEventListener('change', handleFileSelect, false);
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    var xl2json = new ExcelToJSON();
    xl2json.parseExcel(files[0]);
}
var ExcelToJSON = function () {

    this.parseExcel = function (file) {
        var reader = new FileReader();

        reader.onload = function (e) {
            var data = e.target.result;
            var workbook = XLSX.read(data, {
                type: 'binary'
            });

            overall_data = {}
            workbook.SheetNames.forEach(function (sheetName) {
                // Here is your object
                var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                var json_object = JSON.stringify(XL_row_object);
                overall_data[sheetName] = JSON.parse(json_object)
                // console.log(JSON.parse(json_object));
                // jQuery('#xlx_json').val(json_object);
            })
            console.log(overall_data);
            updateData()
        };

        reader.onerror = function (ex) {
            console.log(ex);
        };

        reader.readAsArrayBuffer(file);
    };
};

function updateData() {
    updateOverallValues(overall_data['整体情况-一季度加总'][0])

    let data = overall_data['整体情况-一季度各月份']
    let headers = ['交易总金额', '交易总笔数', '笔均交易金额', '店均交易金额', '店均交易笔数']
    for (let j = 0; j < headers.length; j++) {
        let arr = [], arr_rate_2023 = [], arr_rate_2019 = []
        for (let i = 0; i < data.length; i++) {
            arr.push(+data[i][headers[j]])
            arr_rate_2023.push(+data[i][headers[j] + '较2023年同比增长率'])
            arr_rate_2019.push(+data[i][headers[j] + '较2019年同比增长率'])
        }
        drawIndicatorBar('#indicator-' + (j + 1), arr, headers[j], [arr_rate_2023, arr_rate_2019])
    }

    data = overall_data['整体情况-各城区']
    let arr = []
    current_indicator_global = '交易总金额'
    for (let i = 0; i < data.length; i++) {
        arr.push({
            name: data[i]['城区'],
            value: data[i][current_indicator_global]
        })
    }
    drawMap('map-area-chart', arr)

    data = overall_data['分城区-一级分类']
    arr = []
    let area = '海淀区'
    for (let i = 0; i < data.length; i++) {
        if (data[i]['城区'] === area) {
            arr.push({
                name: data[i]['一级分类'],
                value: data[i][current_indicator_global]
            })
        }
    }
    drawMapRank('map-area-rank-chart', arr, area)

    data = overall_data['整体情况-一级分类']
    arr = []
    for (let i = 0; i < data.length; i++) {
        arr.push({
            name: data[i]['一级分类'],
            value: data[i][current_indicator_global]
        })
    }
    drawRank(arr)

    data = overall_data['整体行业分析-一级行业']
    arr = []
    for (let i = 0; i < data.length; i++) {
        arr.push({
            name: data[i]['一级分类'],
            xValue: data[i]['交易总笔数'],
            yValue: data[i]['笔均交易金额'],
            rate: data[i]['笔均交易金额较2023年同比增长率']
        })
    }
    drawScatterplot(arr)
}

// 99 => 99.00
const options_currency = {
    style: 'currency',
    currency: 'CNY',
};
// 0.991 => 99.10%
const options_percent = {
    style: 'percent',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
};
function updateOverallValues(data) {
    let headers = ['交易总金额', '交易总笔数', '笔均交易金额', '店均交易金额', '店均交易笔数']
    for (let i = 0; i < 5; i++) {
        document.querySelector("#data-t-all #td" + i + " #v0").innerHTML = (+data[headers[i]]).toLocaleString()
        document.querySelector("#data-t-all #td" + i + " #v1").innerHTML = (+data[headers[i] + '较2023年同比增长率']).toLocaleString('zh-CN', options_percent)
        document.querySelector("#data-t-all #td" + i + " #v2").innerHTML = (+data[headers[i] + '较2019年同比增长率']).toLocaleString('zh-CN', options_percent)
        // console.log(data, headers[i], data[headers[i]]);
    }

}

// 绘制五个指标
function drawIndicatorBar(id, data, title, rateData) {
    // 1.实例化对象
    var myChart = echarts.init(document.querySelector(id + " #indicator-bar-chart"));
    // 2.指定配置项和数据
    var option = {
        color: ['#185bff'],
        // 提示框组件
        tooltip: {
            trigger: 'axis',
            axisPointer: { // 坐标轴指示器，坐标轴触发有效
                type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
            },
            backgroundColor: 'rgba(255,255,255,0.7)',
            // 文本样式
            textStyle: {
                // 字体大小
                fontSize: 12,
                fontFamily: 'Microsoft YaHei',
                // 字体颜色
                color: '#000'
            },
            formatter: function (param) {
                let index = param[0].dataIndex
                // console.log(param, title, index);
                // console.log(index, dataBJ[index]);
                // prettier-ignore
                return current_indicator_global + '：' + data[index].toLocaleString('zh-CN', options_currency) + '<br>'
                    + '较2023年同比增长率：' + rateData[0][index].toLocaleString('zh-CN', options_percent) + '<br>'
                    + '较2019年同比增长率：' + rateData[1][index].toLocaleString('zh-CN', options_percent) + '<br>';
            }
        },
        // 修改图表位置大小
        grid: {
            left: '0%',
            top: '10px',
            right: '0%',
            bottom: '4%',
            containLabel: true
        },
        // x轴相关配置
        xAxis: [{
            type: 'category',
            data: ["一月", "二月", "三月"],
            axisTick: {
                alignWithLabel: true
            },
            // 修改刻度标签，相关样式
            axisLabel: {
                color: "rgba(255,255,255,0.8)",
                fontSize: 10
            },
            // x轴样式不显示
            axisLine: {
                show: false
            }
        }],
        // y轴相关配置
        yAxis: [{
            type: 'value',
            // 修改刻度标签，相关样式
            axisLabel: {
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                formatter: function (value) {
                    var res = value.toString();
                    var numN1 = 0;
                    var numN2 = 1;
                    var num1 = 0;
                    var num2 = 0;
                    var t1 = 1;
                    for (var k = 0; k < res.length; k++) {
                        if (res[k] == ".")
                            t1 = 0;
                        if (t1)
                            num1++;
                        else
                            num2++;
                    }

                    if (Math.abs(value) < 1 && res.length > 4) {
                        for (var i = 2; i < res.length; i++) {
                            if (res[i] == "0") {
                                numN2++;
                            } else if (res[i] == ".")
                                continue;
                            else
                                break;
                        }
                        var v = parseFloat(value);
                        v = v * Math.pow(10, numN2);
                        return v.toString() + "e-" + numN2;
                    } else if (num1 > 4) {
                        if (res[0] == "-")
                            numN1 = num1 - 2;
                        else
                            numN1 = num1 - 1;
                        var v = parseFloat(value);
                        v = v / Math.pow(10, numN1);
                        if (num2 > 4)
                            v = v.toFixed(4);
                        return v.toString() + "e" + numN1;
                    } else
                        return parseFloat(value);
                }

            },
            // y轴样式修改
            axisLine: {
                lineStyle: {
                    color: "rgba(255,255,255,0.6)",
                    width: 2
                }
            },
            // y轴分割线的颜色
            splitLine: {
                lineStyle: {
                    color: "rgba(255,255,255,0.1)"
                }
            }
        }],
        // 系列列表配置
        series: [{
            name: '指标',
            type: 'bar',
            barWidth: '35%',
            // ajax传动态数据
            data: data,
            itemStyle: {
                // 修改柱子圆角
                barBorderRadius: 5
            }
        }]
    };
    // 3.把配置项给实例对象
    myChart.setOption(option);

    // 4.让图表随屏幕自适应
    window.addEventListener('resize', function () {
        myChart.resize();
    })
    tab_charts_arr[title] = myChart
}

// 更新不同tab下的宽高
$(function () {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        // 获取已激活的标签页的名称
        var activeTab = $(e.target).text();
        current_indicator_global = activeTab
        // 获取前一个激活的标签页的名称
        var previousTab = $(e.relatedTarget).text();
        // console.log(activeTab, previousTab, activeTab.slice(-1));
        tab_charts_arr[activeTab].resize()
        // $(".active-tab span").html(activeTab);
        // $(".previous-tab span").html(previousTab);

        let data = overall_data['整体情况-各城区']
        let arr = []
        for (let i = 0; i < data.length; i++) {
            arr.push({
                name: data[i]['城区'],
                value: data[i][activeTab]
            })
        }
        // get max min
        let data_arr = arr.map(({ value }) => value)
        const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
        tab_charts_arr["mapAreaChart"].setOption({
            visualMap: {
                min: min_v,
                max: max_v
            },
            series: [{
                data: arr
            }]
        });

        data = overall_data['分城区-一级分类']
        arr = []
        let area = document.getElementById("area-rank-h3").innerHTML.slice(0, 3)
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                arr.push({
                    name: data[i]['一级分类'],
                    value: data[i][activeTab]
                })
            }
        }
        drawMapRank('map-area-rank-chart', arr, area)

        data = overall_data['整体情况-一级分类']
        arr = []
        for (let i = 0; i < data.length; i++) {
            arr.push({
                name: data[i]['一级分类'],
                value: data[i][activeTab]
            })
        }
        arr.sort((a, b) => { return b.value - a.value })
        const xData = [];
        const yData = [];
        for (let i in arr) {
            xData.push(arr[i].value);
            yData.push(arr[i].name);
        }
        tab_charts_arr["rankChart"].setOption({
            yAxis: {
                data: yData
            },
            series: [{
                data: xData
            }]
        });
    });
});


function drawMap(id, data) {
    // get max min
    let data_arr = data.map(({ value }) => value)
    const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
    // console.log(min_v, max_v);
    // 基于准备好的dom，初始化echarts实例
    let mychart = echarts.init(document.getElementById(id))
    // 监听屏幕变化自动缩放图表
    window.addEventListener('resize', function () {
        mychart.resize()
    })
    // 绘制图表
    mychart.setOption({
        // 图表主标题
        // title: {
        //     // 文本
        //     text: '北京',
        //     // 值: 'top', 'middle', 'bottom' 也可以是具体的值或者百分比
        //     top: 5,
        //     // 值: 'left', 'center', 'right' 同上
        //     left: 'center',
        //     // 文本样式
        //     textStyle: {
        //         // 字体大小
        //         fontSize: 25,
        //         // 字体粗细
        //         fontWeight: 650,
        //         // 字体颜色
        //         color: '#fff'
        //     }
        // },
        // 提示框组件
        tooltip: {
            // 触发类型, 数据项图形触发
            trigger: 'item',
            backgroundColor: 'rgba(255,255,255,0.7)',
            // 文本样式
            textStyle: {
                // 字体大小
                fontSize: 12,
                fontFamily: 'Microsoft YaHei',
                // 字体颜色
                color: '#000'
            },
            // 使用函数模板，传入的数据值 ——> value: number | Array
            formatter: function (val) {
                // console.log(val.data);
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + val.data.name
                    + '</div>'
                    + current_indicator_global + ': ' + (val.data.value).toLocaleString('zh-CN', options_currency)
            }
        },
        // 视觉映射组件
        visualMap: {
            // continuous 类型为连续型
            type: 'continuous',
            show: true, // 是否显示 visualMap-continuous 组件 如果设置为 false，不会显示，但是数据映射的功能还存在
            // 指定 visualMapContinuous 组件的允许的最小/大值 min/max 必须用户指定
            min: min_v,
            // min,max 形成了视觉映射的定义域
            max: max_v,
            // 文本样式
            textStyle: {
                // 字体大小
                fontSize: 12,
                fontFamily: 'Microsoft YaHei',
                // 字体颜色
                color: '#00ffff'
            },
            // 拖拽时，是否实时更新
            realtime: false,
            // 是否显示拖拽用的手柄
            calculable: true,
            // 定义在选中范围中的视觉元素
            inRange: {
                // 图元的颜色
                color: ['#b0c2f9', '#185bff']
            },
            right: "right"
        },
        series: [
            {
                // 类型
                type: 'map',
                // 系列名称，用于tooltip的显示，legend 的图例筛选 在 setOption 更新数据和配置项时用于指定对应的系列
                map: '北京',
                // 地图类型
                mapType: 'province',
                // 是否开启鼠标缩放和平移漫游 默认不开启 
                // 如果只想要开启缩放或者平移，可以设置成 'scale' 或者 'move' 设置成 true 为都开启
                roam: true,
                // 定位 值: 'top', 'middle', 'bottom' 也可以是具体的值或者百分比
                top: 20,
                // 图形上的文本标签
                label: {
                    show: false // 是否显示对应地名
                },
                // 地图区域的多边形 图形样式
                itemStyle: {
                    // 地图区域的颜色 如果设置了visualMap, 这个属性将不起作用
                    areaColor: '#7B68EE',
                    // 描边线宽 为 0 时无描边
                    borderWidth: 0.5,
                    // 图形的描边颜色 支持的颜色格式同 color
                    borderColor: '#000',
                    // 描边类型，默认为实线，支持 'solid', 'dashed', 'dotted'
                    borderType: 'solid'
                },
                // 高亮状态
                emphasis: {
                    // 文本标签
                    label: {
                        // 是否显示标签
                        show: true,
                        // 文字的颜色 如果设置为 'auto'，则为视觉映射得到的颜色，如系列色
                        color: '#fff'
                    },
                    // 图形样式
                    itemStyle: {
                        // 地图区域的颜色
                        areaColor: '#FF6347'
                    }
                },
                // 地图系列中的数据内容数组，数组项可以为单个数值
                data: data
                // [
                //     { name: '怀柔区', value: 38.4, lng: 116.63853, lat: 40.322563 },
                //     { name: '密云区', value: 47.9, lng: 116.849551, lat: 40.382999 },
                //     { name: '昌平区', value: 196.3, lng: 116.237832, lat: 40.226854 },
                //     { name: '顺义区', value: 102, lng: 116.663242, lat: 40.1362 },
                //     { name: '平谷区', value: 42.3, lng: 117.128025, lat: 40.147115 },
                //     { name: '门头沟区', value: 30.8, lng: 116.108179, lat: 39.94648 },
                //     { name: '海淀区', value: 369.4, lng: 116.304872, lat: 39.96553 },
                //     { name: '石景山区', value: 65.2, lng: 116.229612, lat: 39.912017 },
                //     { name: '西城区', value: 129.8, lng: 116.372397, lat: 39.918561 },
                //     { name: '东城区', value: 90.5, lng: 116.42272, lat: 39.934579 },
                //     { name: '朝阳区', value: 395.5, lng: 116.449767, lat: 39.927254 },
                //     { name: '大兴区', value: 156.2, lng: 116.348053, lat: 39.732833 },
                //     { name: '房山区', value: 104.6, lng: 116.149892, lat: 39.755039 },
                //     { name: '丰台区', value: 232.4, lng: 116.293105, lat: 39.865042 },
                //     { name: '延庆区', value: 104.6 },
                //     { name: '通州区', value: 232.4 }
                // ]
            }
        ]
    })
    mychart.on("click", function (params) { //点击事件
        // console.log('我被点击了', params)
        // 读取数据
        let data = overall_data['分城区-一级分类'],
            arr = []
        let area = params.name
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                arr.push({
                    name: data[i]['一级分类'],
                    value: data[i][current_indicator_global]
                })
            }
        }
        // console.log(area, arr);
        // 渲染
        drawMapRank("map-area-rank-chart", arr, area)
    });
    tab_charts_arr["mapAreaChart"] = mychart
}

// drawMap('map-area-chart')
// drawMap('map-business-chart')

function drawRank(data) {
    //获取排行数据
    data.sort((a, b) => { return b.value - a.value })
    const xData = [];
    const yData = [];
    for (let i in data) {
        xData.push(data[i].value);
        yData.push(data[i].name);
    }

    const rankChart = echarts.init(document.getElementById("rankChart"), "shine");
    const rankChartOpt = {
        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "shadow"
            },
            backgroundColor: 'rgba(255,255,255,0.7)',
            // 文本样式
            textStyle: {
                // 字体大小
                fontSize: 12,
                fontFamily: 'Microsoft YaHei',
                // 字体颜色
                color: '#000'
            },
            formatter: function (params) {
                const val = params[0];
                console.log(val);
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + val.name
                    + '</div>'
                    + current_indicator_global + ': ' + (val.data).toLocaleString('zh-CN', options_currency)
            }
            // function (params) {
            //     const param = params[0];
            //     const marker = '<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:#e6b600;"></span>';
            //     const suffix = '<span style="margin-left:5px;font-size:12px;">亿元</span>';
            //     return param.name + "<br />" +
            //         marker + "排名：" + (param.dataIndex + 1) + "<br />" +
            //         marker + "市价总值：" + param.value + suffix;
            // }
        },
        grid: {
            top: 10,
            bottom: 10,
            left: 60
        },
        xAxis: {
            show: false,
            type: "value"
        },
        yAxis: {
            type: "category",
            inverse: true,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: {
                fontSize: 12,
                color: "#b0c2f9"
            },
            data: yData
        },
        series: [{
            name: "行业排行",
            type: "bar",
            barCategoryGap: "60%",
            label: {
                show: true,
                position: "right",
                fontSize: 12,
                color: "#188df0",
                emphasis: {
                    color: "#e6b600"
                }
            },
            itemStyle: {
                normal: {
                    color: new echarts.graphic.LinearGradient(
                        0, 1, 1, 1,
                        [
                            { offset: 0, color: '#b0c2f9' },
                            { offset: 0.5, color: '#188df0' },
                            { offset: 1, color: '#185bff' }
                        ]
                    )
                },
                emphasis: {
                    color: new echarts.graphic.LinearGradient(
                        0, 1, 1, 1,
                        [
                            { offset: 0, color: '#b0c2f9' },
                            { offset: 0.7, color: '#e6b600' },
                            { offset: 1, color: '#ceac09' }
                        ]
                    )
                }
            },
            data: xData
        }]
    };
    rankChart.setOption(rankChartOpt);
    // 4.让图表随屏幕自适应
    window.addEventListener('resize', function () {
        rankChart.resize();
    })
    tab_charts_arr["rankChart"] = rankChart
    // $.ajax({
    //     url: "data/ranking-list.json",
    //     dataType: "json"
    // }).done(function () {
    //     $("#rankChart").addClass("chart-done");
    // }).done(function (data) {
    //     //console.log('Data: ', data);
    //     const xData = [];
    //     const yData = [];
    //     for (let i in data) {
    //         xData.push(data[i].market_capitalization);
    //         yData.push(data[i].stock_name);
    //     }
    //     rankChart.setOption({
    //         yAxis: {
    //             data: yData
    //         },
    //         series: [{
    //             name: "市价总值排行",
    //             data: xData
    //         }]
    //     });
    // }).fail(function (jqXHR) {
    //     console.log("Ajax Fail: ", jqXHR.status, jqXHR.statusText);
    // });
}
// drawRank()

function drawMapRank1(id) {
    let charts = echarts.init(document.getElementById(id))
    var option = {
        color: ['#d84430'],
        tooltip: {
            show: true
        },
        yAxis: {
            axisTick: {
                show: false
            },
            axisLine: {
                show: false,
            },
            axisLabel: {
                inside: true,
                verticalAlign: 'bottom',
                lineHeight: 40,
                color: '#DDDFEB',
                formatter: function (value, index) {   // 设置y轴文字的颜色
                    if (index > 2) {
                        return '{first|' + value + '}'
                    } else {
                        return '{other|' + value + '}'
                    }
                },
                rich: {
                    other: {
                        color: '#DDDFEB',
                        opacity: 0.57
                    },
                    first: {
                        color: '#DDDFEB'
                    }
                }
            },
            data: ['陕西移动', '山西移动', '北京移动', '山东移动', '河北移动', '河南移动']
        },
        xAxis: {
            nameTextStyle: {
                color: 'rgba(255, 255, 255, 0.8)',
                align: 'right'
            },
            splitLine: {
                show: false,
            },
            axisLine: {
                show: false,
            },
            axisLabel: {
                color: 'rgba(255, 255, 255, 0.8)'
            },
        },
        grid: {
            top: '0%',
            bottom: '0%',
            left: '0%',
            right: '0%'
        },
        series: [{
            name: '预警排行榜',
            barWidth: 15,
            type: 'bar',
            data: [1, 1, 1, 2, 3, 3],
            itemStyle: {
                normal: {
                    borderRadius: [3, 20, 20, 3],
                    color: function (params) {   // 设置柱形图的颜色
                        if (params.dataIndex === 5) {
                            return '#d84430'
                        } else if (params.dataIndex === 4) {
                            return '#f38237'
                        } else if (params.dataIndex === 3) {
                            return '#e2aa20'
                        } else {
                            return '#608289'
                        }
                    }
                },
            }
        }]
    };
    // 使用刚指定的配置项和数据显示图表。
    charts.setOption(option);
    window.addEventListener('resize', () => {
        charts.resize()
    })
}
function drawMapRank(id, data, areaName) {
    document.getElementById("area-rank-h3").innerHTML = areaName + "内行业排名"
    //获取排行数据
    data.sort((a, b) => { return b.value - a.value })
    var main_div = document.getElementById(id);
    main_div.style.paddingTop = "25px"
    main_div.innerHTML = ''
    for (let i in data) {
        var div = document.createElement("div");
        div.setAttribute("class", "flex1")
        // div.style.marginTop = "10px"
        var span = document.createElement("span");
        span.innerHTML = "No." + (+i + 1) + " " + data[i].name + "：" + (data[i].value).toLocaleString('zh-CN', options_currency)
        span.style.color = "#fff";
        // span.style.backgroundColor = "yellow";
        span.style.fontSize = "12px";
        span.style.whiteSpace = 'nowrap';
        div.appendChild(span)
        main_div.appendChild(div);
        // if (i >= 10) {
        //     break
        // }
    }
    // $.ajax({
    //     url: "data/ranking-list.json",
    //     dataType: "json"
    // }).done(function (data) {
    //     //console.log('Data: ', data);
    //     const xData = [];
    //     const yData = [];
    //     for (let i in data) {
    //         xData.push(data[i].market_capitalization);
    //         yData.push(data[i].stock_name);
    //         var div = document.createElement("div");
    //         div.setAttribute("class", "flex1")
    //         // div.style.marginTop = "10px"
    //         var span = document.createElement("span");
    //         span.innerHTML = "No." + (+i + 1) + " " + data[i].stock_name + " : " + data[i].market_capitalization
    //         span.style.color = "#fff";
    //         // span.style.backgroundColor = "yellow";
    //         span.style.fontSize = "12px";
    //         div.appendChild(span)
    //         main_div.appendChild(div);
    //         if (i >= 10) {
    //             break
    //         }
    //     }
    // }).fail(function (jqXHR) {
    //     console.log("Ajax Fail: ", jqXHR.status, jqXHR.statusText);
    // });
}
// drawMapRank('map-area-rank-chart')
// drawMapRank('map-business-rank-chart')

function drawBubbleChart() {
    var chartDom = document.getElementById('bubble-chart');
    var myChart = echarts.init(chartDom);
    var option;

    $.when(
        $.get('data/option-view.json'),
        $.getScript(
            'js/d3-hierarchy.min.js'
        )
    ).done(function (res) {
        run(res[0]);
    });
    function run(rawData) {
        console.log(rawData);
        const dataWrap = prepareData(rawData);
        initChart(dataWrap.seriesData, dataWrap.maxDepth);
    }
    function prepareData(rawData) {
        const seriesData = [];
        let maxDepth = 0;
        function convert(source, basePath, depth) {
            if (source == null) {
                return;
            }
            if (maxDepth > 5) {
                return;
            }
            maxDepth = Math.max(depth, maxDepth);
            seriesData.push({
                id: basePath,
                value: source.$count,
                depth: depth,
                index: seriesData.length
            });
            for (var key in source) {
                if (source.hasOwnProperty(key) && !key.match(/^\$/)) {
                    var path = basePath + '.' + key;
                    convert(source[key], path, depth + 1);
                }
            }
        }
        convert(rawData, 'option', 0);
        return {
            seriesData: seriesData,
            maxDepth: maxDepth
        };
    }
    function initChart(seriesData, maxDepth) {
        var displayRoot = stratify();
        function stratify() {
            return d3
                .stratify()
                .parentId(function (d) {
                    return d.id.substring(0, d.id.lastIndexOf('.'));
                })(seriesData)
                .sum(function (d) {
                    return d.value || 0;
                })
                .sort(function (a, b) {
                    return b.value - a.value;
                });
        }
        function overallLayout(params, api) {
            var context = params.context;
            d3
                .pack()
                .size([api.getWidth() - 2, api.getHeight() - 2])
                .padding(3)(displayRoot);
            context.nodes = {};
            displayRoot.descendants().forEach(function (node, index) {
                context.nodes[node.id] = node;
            });
        }
        function renderItem(params, api) {
            var context = params.context;
            // Only do that layout once in each time `setOption` called.
            if (!context.layout) {
                context.layout = true;
                overallLayout(params, api);
            }
            var nodePath = api.value('id');
            var node = context.nodes[nodePath];
            if (!node) {
                // Reder nothing.
                return;
            }
            var isLeaf = !node.children || !node.children.length;
            var focus = new Uint32Array(
                node.descendants().map(function (node) {
                    return node.data.index;
                })
            );
            var nodeName = isLeaf
                ? nodePath
                    .slice(nodePath.lastIndexOf('.') + 1)
                    .split(/(?=[A-Z][^A-Z])/g)
                    .join('\n')
                : '';
            var z2 = api.value('depth') * 2;
            return {
                type: 'circle',
                focus: focus,
                shape: {
                    cx: node.x,
                    cy: node.y,
                    r: node.r
                },
                transition: ['shape'],
                z2: z2,
                textContent: {
                    type: 'text',
                    style: {
                        // transition: isLeaf ? 'fontSize' : null,
                        text: nodeName,
                        fontFamily: 'Arial',
                        width: node.r * 1.3,
                        overflow: 'truncate',
                        fontSize: node.r / 3,
                        fill: 'white'
                    },
                    emphasis: {
                        style: {
                            overflow: null,
                            fontSize: Math.max(node.r / 3, 12)
                        }
                    }
                },
                textConfig: {
                    position: 'inside'
                },
                style: {
                    fill: api.visual('color')
                },
                emphasis: {
                    style: {
                        fontFamily: 'Arial',
                        fontSize: 12,
                        shadowBlur: 10,
                        shadowOffsetX: 3,
                        shadowOffsetY: 5,
                        shadowColor: 'rgba(0,0,0,0.3)'
                    }
                }
            };
        }
        option = {
            dataset: {
                source: seriesData
            },
            tooltip: {},
            visualMap: [
                {
                    show: false,
                    min: 0,
                    max: maxDepth,
                    dimension: 'depth',
                    inRange: {
                        color: ['#006edd', '#e0ffff']
                    }
                }
            ],
            hoverLayerThreshold: Infinity,
            series: {
                type: 'custom',
                renderItem: renderItem,
                progressive: 0,
                coordinateSystem: 'none',
                encode: {
                    tooltip: 'value',
                    itemName: 'id'
                }
            }
        };
        myChart.setOption(option);
        myChart.on('click', { seriesIndex: 0 }, function (params) {
            drillDown(params.data.id);
        });
        function drillDown(targetNodeId) {
            displayRoot = stratify();
            if (targetNodeId != null) {
                displayRoot = displayRoot.descendants().find(function (node) {
                    return node.data.id === targetNodeId;
                });
            }
            // A trick to prevent d3-hierarchy from visiting parents in this algorithm.
            displayRoot.parent = null;
            myChart.setOption({
                dataset: {
                    source: seriesData
                }
            });
        }
        // Reset: click on the blank area.
        myChart.getZr().on('click', function (event) {
            if (!event.target) {
                drillDown();
            }
        });
    }

    option && myChart.setOption(option);
    // 4.让图表随屏幕自适应
    window.addEventListener('resize', function () {
        myChart.resize();
    })
}
// drawBubbleChart()

function drawScatterplot(data) {
    var chartDom = document.getElementById('bubble-chart');
    var myChart = echarts.init(chartDom);
    var option;
    const dataBJ = data
    // get max min
    let data_arr = data.map(({ rate }) => Math.abs(rate))
    const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
    // const dataBJ = [
    //     { name: '怀柔区', xValue: 38.4, yValue: 16.63853, rate: 40.322563, sign: 0 },
    //     { name: '密云区', xValue: 47.9, yValue: 56.849551, rate: 20.382999, sign: 0 },
    //     { name: '昌平区', xValue: 196.3, yValue: 26.237832, rate: 10.226854, sign: 1 },
    //     { name: '顺义区', xValue: 102, yValue: 46.663242, rate: 60.1362, sign: 1 },
    //     { name: '平谷区', xValue: 42.3, yValue: 57.128025, rate: 20.147115, sign: 1 },
    //     { name: '门头沟区', xValue: 30.8, yValue: 76.108179, rate: 9.94648, sign: 0 },
    //     { name: '海淀区', xValue: 369.4, yValue: 45.304872, rate: 99.96553, sign: 0 },
    //     { name: '石景山区', xValue: 65.2, yValue: 36.229612, rate: 29.912017, sign: 0 },
    //     { name: '西城区', xValue: 129.8, yValue: 77.372397, rate: 45.918561, sign: 0 },
    //     { name: '东城区', xValue: 90.5, yValue: 55.42272, rate: 23.934579, sign: 1 },
    //     { name: '朝阳区', xValue: 395.5, yValue: 33.449767, rate: 12.927254, sign: 0 },
    //     { name: '大兴区', xValue: 156.2, yValue: 54.348053, rate: 3.732833, sign: 1 },
    //     { name: '房山区', xValue: 104.6, yValue: 37.149892, rate: 7.755039, sign: 0 },
    //     { name: '丰台区', xValue: 232.4, yValue: 49.293105, rate: 10.865042, sign: 0 },
    //     { name: '延庆区', xValue: 84.6, yValue: 59.293105, rate: 29.865042, sign: 0 },
    //     { name: '通州区', xValue: 32.4, yValue: 78.293105, rate: 39.865042, sign: 0 }
    // ]
    let filteredUp = [], filteredDown = [];
    for (let i = 0; i < dataBJ.length; i++) {
        if (dataBJ[i].sign === 1) {
            filteredUp.push([dataBJ[i].xValue, dataBJ[i].yValue, Math.abs(dataBJ[i].rate), i])
        } else {
            filteredDown.push([dataBJ[i].xValue, dataBJ[i].yValue, Math.abs(dataBJ[i].rate), i])
        }
    }
    // console.log(filteredUp, filteredDown);
    const itemStyle = {
        opacity: 0.8,
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowColor: 'rgba(0,0,0,0.3)'
    };
    option = {
        color: ['#FF0000', '#00FF00'],
        legend: {
            top: 10,
            data: ['增长', '下降'],
            textStyle: {
                fontSize: 16,
                color: "white"
            }
        },
        // 文本样式
        textStyle: {
            // 字体大小
            fontSize: 16,
            fontFamily: 'Microsoft YaHei',
            // 字体颜色
            color: 'white'
        },
        grid: {
            left: '10%',
            right: 150,
            top: '18%',
            bottom: '10%'
        },
        tooltip: {
            backgroundColor: 'rgba(255,255,255,0.7)',
            // 文本样式
            textStyle: {
                // 字体大小
                fontSize: 12,
                fontFamily: 'Microsoft YaHei',
                // 字体颜色
                color: '#000'
            },
            formatter: function (param) {
                let index = param.value[3]
                // console.log(index, dataBJ[index]);
                // prettier-ignore
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + dataBJ[index].name
                    + '</div>'
                    + '消费笔数：' + Math.round(dataBJ[index].xValue) + '<br>'
                    + '笔均金额：' + dataBJ[index].yValue + '<br>'
                    + '同比' + (dataBJ[index].rate > 0 ? '增加' : '下降') + '：' + dataBJ[index].rate + '<br>';
            }
        },
        xAxis: {
            type: 'value',
            name: '消费笔数',
            nameGap: 16,
            nameTextStyle: {
                fontSize: 16
            },
            // max: 31,
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            name: '笔均金额',
            nameLocation: 'end',
            nameGap: 20,
            nameTextStyle: {
                fontSize: 16
            },
            splitLine: {
                show: false
            }
        },
        visualMap: [
            {
                left: 'right',
                top: '10%',
                dimension: 2,
                min: min_v,
                max: max_v,
                // 文本样式
                textStyle: {
                    // 字体大小
                    fontSize: 16,
                    fontFamily: 'Microsoft YaHei',
                    // 字体颜色
                    color: 'white'
                },
                itemWidth: 30,
                itemHeight: 120,
                calculable: true,
                precision: 2,
                text: ['圆形大小：变化幅度'],
                textGap: 30,
                inRange: {
                    symbolSize: [10, 70]
                },
                outOfRange: {
                    symbolSize: [10, 70],
                    color: ['rgba(255,255,255,0.4)']
                },
                controller: {
                    inRange: {
                        color: ['#185bff']
                    },
                    outOfRange: {
                        color: ['#999']
                    }
                }
            }
        ],
        series: [
            {
                name: '增长',
                type: 'scatter',
                itemStyle: itemStyle,
                data: filteredUp,
                label: {
                    show: true,
                    formatter: param => {
                        let index = param.value[3]
                        return dataBJ[index].name;
                    },
                    position: 'right',
                    // 文本样式
                    textStyle: {
                        // 字体大小
                        fontSize: 12,
                        fontFamily: 'Microsoft YaHei',
                        // 字体颜色
                        color: 'white'
                    }
                }
            },
            {
                name: '下降',
                type: 'scatter',
                itemStyle: itemStyle,
                data: filteredDown,
                label: {
                    show: true,
                    formatter: param => {
                        let index = param.value[3]
                        return dataBJ[index].name;
                    },
                    position: 'right',
                    // 文本样式
                    textStyle: {
                        // 字体大小
                        fontSize: 12,
                        fontFamily: 'Microsoft YaHei',
                        // 字体颜色
                        color: 'white'
                    }
                }
            }
        ]
    };

    option && myChart.setOption(option);
    // 4.让图表随屏幕自适应
    window.addEventListener('resize', function () {
        myChart.resize();
    })
}
// drawScatterplot()