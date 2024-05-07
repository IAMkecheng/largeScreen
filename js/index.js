
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
    let headers = ['交易总金额', '交易总笔数', '笔均交易金额', '店均交易金额', '店均交易笔数'],
        names = ['亿元', '万笔', '元', '万元', '笔']
    for (let j = 0; j < headers.length; j++) {
        let arr = [], arr_rate_2023 = [], arr_rate_2019 = []
        for (let i = 0; i < data.length; i++) {
            arr.push(getFormatValues(headers[j], +data[i][headers[j]]))
            arr_rate_2023.push(+data[i][headers[j] + '较2023年同比增长率'])
            arr_rate_2019.push(+data[i][headers[j] + '较2019年同比增长率'])
        }
        drawIndicatorBar('#indicator-' + (j + 1), arr, headers[j], [arr_rate_2023, arr_rate_2019], names[j])
    }

    data = overall_data['整体情况-各城区']
    let arr = []
    current_indicator_global = '交易总金额'
    let area = '海淀区'
    for (let i = 0; i < data.length; i++) {
        arr.push({
            name: data[i]['城区'],
            value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
        })
        if (data[i]['城区'] === area) {
            updateAreaValues(data[i], area)
        }
    }
    drawMap('map-area-chart', arr)

    data = overall_data['分城区-一级分类']
    arr = []
    for (let i = 0; i < data.length; i++) {
        if (data[i]['城区'] === area) {
            arr.push({
                name: data[i]['一级分类'],
                value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
            })
        }
    }
    drawMapRank('map-area-rank-chart', arr, area, "area-rank-h3")

    data = overall_data['商圈']
    arr = []
    for (let i = 0; i < data.length; i++) {
        arr.push({
            name: data[i]['商圈名'],
            value: getFormatValues(current_indicator_global, data[i][current_indicator_global]),
            lng: data[i]['经度'],
            lat: data[i]['纬度'],
            area: data[i]['城区']
        })
    }
    drawHeatmap('map-business-chart', arr)
    arr = []
    for (let i = 0; i < data.length; i++) {
        if (data[i]['城区'] === area) {
            arr.push({
                name: data[i]['商圈名'],
                value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
            })
        }
    }
    drawMapRank('map-business-rank-chart', arr, area, "business-rank-h3")

    data = overall_data['整体情况-一级分类']
    arr = []
    for (let i = 0; i < data.length; i++) {
        arr.push({
            name: data[i]['一级分类'],
            value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
        })
    }
    drawRank(arr)


    // data = overall_data['整体行业分析-一级行业']
    // arr = []
    // for (let i = 0; i < data.length; i++) {
    //     arr.push({
    //         name: data[i]['一级分类'],
    //         xValue: getFormatValues('交易总笔数', data[i]['交易总笔数']),
    //         yValue: getFormatValues('笔均交易金额', data[i]['笔均交易金额']),
    //         rate: data[i]['笔均交易金额较2023年同比增长率']
    //     })
    // }
    data = overall_data['分城区-一级分类']
    arr = []
    for (let i = 0; i < data.length; i++) {
        if (data[i]['城区'] === area) {
            arr.push({
                name: data[i]['一级分类'],
                xValue: getFormatValues('交易总金额', data[i]['交易总金额']),
                yValue: getFormatValues('笔均交易金额', data[i]['笔均交易金额']),
                rate: data[i]['笔均交易金额较2023年同比增长率']
            })
        }
    }
    drawScatterplot(arr)

    data = overall_data['分城区-二级分类']
    let business = "生活百货"
    arr = []
    for (let i = 0; i < data.length; i++) {
        if (data[i]['城区'] === area && data[i]['一级分类'] === business) {
            arr.push({
                name: data[i]['二级分类'],
                value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
            })
        }
    }
    drawMapRank('area-business-rank-chart', arr, area + "-" + business, "area-business-rank-h3")

    data = overall_data['城市互动-北京消费构成']
    let data1 = overall_data['城市互动-北京人在外地消费']
    let node_arr = []
    let link_arr = []
    node_arr.push({
        name: '北京市'
    })
    for (let i = 0; i < data.length; i++) {
        if (data[i]['交易金额占比'] >= 0.0014 && data[i]['城市'] != '北京市') {
            node_arr.push({
                name: data[i]['城市'] + "-in"
            })
            link_arr.push({
                source: data[i]['城市'] + "-in",
                target: '北京市',
                value: data[i]['交易金额占比']
            })
        }
    }
    data = overall_data['城市互动-北京人在外地消费']
    for (let i = 0; i < data.length; i++) {
        if (data[i]['交易金额占比'] >= 0.01) {
            node_arr.push({
                name: data[i]['城市'] + "-out"
            })
            link_arr.push({
                source: '北京市',
                target: data[i]['城市'] + "-out",
                value: data[i]['交易金额占比']
            })
        }
    }
    drawSankeyDiagram(node_arr, link_arr)
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
function getFormatValues(name, value) {
    let format_value
    switch (name) {
        case '交易总金额':
            format_value = (value / 100000000)
            return format_value;
        case '交易总笔数':
            format_value = (value / 10000)
            return format_value;
        case '笔均交易金额':
            format_value = (value)
            return format_value;
        case '店均交易金额':
            format_value = (value / 10000)
            return format_value;
        case '店均交易笔数':
            format_value = (value)
            return format_value;
    }
}
function formatValues(name, value) {
    switch (name) {
        case '交易总金额':
            if (value < 0.005) return value.toFixed(4) + "亿元";
            return value.toFixed(2) + "亿元";
        case '交易总笔数':
            if (value < 0.005) return value.toFixed(4) + "万笔";
            return value.toFixed(2) + "万笔";
        case '笔均交易金额':
            return value.toFixed(2) + "元";
        case '店均交易金额':
            if (value < 0.005) return value.toFixed(4) + "万元";
            return value.toFixed(2) + "万元";
        case '店均交易笔数':
            return value.toFixed(2) + "笔";
    }
}
function updateOverallValues(data) {
    let headers = ['交易总金额', '交易总笔数', '笔均交易金额', '店均交易金额', '店均交易笔数']
    for (let i = 0; i < 5; i++) {
        document.querySelector("#data-t-all #td" + i + " #v0").innerHTML = formatValues(headers[i], getFormatValues(headers[i], +data[headers[i]]))
        document.querySelector("#data-t-all #td" + i + " #v1").innerHTML = (+data[headers[i] + '较2023年同比增长率']).toLocaleString('zh-CN', options_percent)
        document.querySelector("#data-t-all #td" + i + " #v2").innerHTML = (+data[headers[i] + '较2019年同比增长率']).toLocaleString('zh-CN', options_percent)
        // console.log(data, headers[i], data[headers[i]]);
    }

}
function updateAreaValues(data, area) {
    let headers = ['交易总金额', '交易总笔数', '笔均交易金额', '店均交易金额', '店均交易笔数']
    for (let i = 0; i < 5; i++) {
        document.querySelector("#data-t-area #td" + i + " #v0").innerHTML = formatValues(headers[i], getFormatValues(headers[i], +data[headers[i]]))
        document.querySelector("#data-t-area #td" + i + " #v1").innerHTML = (+data[headers[i] + '较2023年同比增长率']).toLocaleString('zh-CN', options_percent)
        document.querySelector("#data-t-area #td" + i + " #v2").innerHTML = (+data[headers[i] + '较2019年同比增长率']).toLocaleString('zh-CN', options_percent)
        // console.log(data, headers[i], data[headers[i]]);
    }
    document.getElementById('detail_area_h3').innerHTML = area + "具体交易情况"
}
// 绘制五个指标
function drawIndicatorBar(id, data, title, rateData, name) {
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
                return current_indicator_global + '：' + formatValues(current_indicator_global, data[index]) + '<br>'
                    + '较2023年同比增长率：' + rateData[0][index].toLocaleString('zh-CN', options_percent) + '<br>'
                    + '较2019年同比增长率：' + rateData[1][index].toLocaleString('zh-CN', options_percent) + '<br>';
            }
        },
        // 修改图表位置大小
        grid: {
            left: '0%',
            top: '30px',
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
            name: name,
            nameTextStyle: {
                fontSize: 16,
                color: '#999999',
                // name 位置
                padding: [0, 0, 0, 0]
            },
            // 修改刻度标签，相关样式
            axisLabel: {
                color: "rgba(255,255,255,0.6)",
                fontSize: 12
                // ,
                // formatter: function (value) {
                //     var res = value.toString();
                //     var numN1 = 0;
                //     var numN2 = 1;
                //     var num1 = 0;
                //     var num2 = 0;
                //     var t1 = 1;
                //     for (var k = 0; k < res.length; k++) {
                //         if (res[k] == ".")
                //             t1 = 0;
                //         if (t1)
                //             num1++;
                //         else
                //             num2++;
                //     }

                //     if (Math.abs(value) < 1 && res.length > 4) {
                //         for (var i = 2; i < res.length; i++) {
                //             if (res[i] == "0") {
                //                 numN2++;
                //             } else if (res[i] == ".")
                //                 continue;
                //             else
                //                 break;
                //         }
                //         var v = parseFloat(value);
                //         v = v * Math.pow(10, numN2);
                //         return v.toString() + "e-" + numN2;
                //     } else if (num1 > 4) {
                //         if (res[0] == "-")
                //             numN1 = num1 - 2;
                //         else
                //             numN1 = num1 - 1;
                //         var v = parseFloat(value);
                //         v = v / Math.pow(10, numN1);
                //         if (num2 > 4)
                //             v = v.toFixed(4);
                //         return v.toString() + "e" + numN1;
                //     } else
                //         return parseFloat(value);
                // }

            },
            // y轴样式修改
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#1f2a62'
                }
                // lineStyle: {
                //     color: "rgba(255,255,255,0.6)",
                //     width: 2
                // }
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
                value: getFormatValues(current_indicator_global, data[i][activeTab])
            })
        }
        // get max min
        let data_arr = arr.map(({ value }) => value)
        let max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
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
        let area = document.getElementById("area-rank-h3").innerHTML.split("内")[0]
        console.log('420', area);
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                arr.push({
                    name: data[i]['一级分类'],
                    value: getFormatValues(current_indicator_global, data[i][activeTab])
                })
            }
        }
        drawMapRank('map-area-rank-chart', arr, area, "area-rank-h3")

        data = overall_data['商圈']
        arr = []
        for (let i = 0; i < data.length; i++) {
            arr.push({
                name: data[i]['商圈名'],
                value: getFormatValues(current_indicator_global, data[i][activeTab]),
                lng: data[i]['经度'],
                lat: data[i]['纬度'],
                area: data[i]['城区']
            })
        }
        // get max min
        data_arr = arr.map(({ value }) => value)
        max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
        // get heapmap data
        let heat_data = []
        for (let i = 0; i < arr.length; i++) {
            heat_data.push([arr[i].lng, arr[i].lat, arr[i].value, i])
        }
        tab_charts_arr["mapBusinessChart"].setOption({
            visualMap: {
                min: min_v,
                max: max_v
            },
            series: [{
                data: heat_data
            }, {
                data: heat_data
            }]
        });
        arr = []
        area = document.getElementById("business-rank-h3").innerHTML.slice(0, 3)
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                arr.push({
                    name: data[i]['商圈名'],
                    value: getFormatValues(current_indicator_global, data[i][activeTab])
                })
            }
        }
        drawMapRank('map-business-rank-chart', arr, area, "business-rank-h3")

        data = overall_data['整体情况-一级分类']
        arr = []
        for (let i = 0; i < data.length; i++) {
            arr.push({
                name: data[i]['一级分类'],
                value: getFormatValues(current_indicator_global, data[i][activeTab])
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


        data = overall_data['分城区-二级分类']
        area = document.getElementById("area-business-rank-h3").innerHTML.split("-")[0]
        let business = document.getElementById("area-business-rank-h3").innerHTML.split("-")[1].split(" ")[0]
        console.log('500', area, business);
        arr = []
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area && data[i]['一级分类'] === business) {
                arr.push({
                    name: data[i]['二级分类'],
                    value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
                })
            }
        }
        drawMapRank('area-business-rank-chart', arr, area + "-" + business, "area-business-rank-h3")
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
                    + current_indicator_global + ': ' + formatValues(current_indicator_global, (val.data.value))
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
                zoom: 1.2,
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
            }
        ]
    })
    mychart.on("click", function (params) { //点击事件
        // console.log('我被点击了', params)
        // 读取数据
        let data = overall_data['分城区-一级分类'],
            arr = [],
            area_arr = []
        let area = params.name
        document.getElementById('bubble-h3').innerHTML = area + " - 一级分类"
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                arr.push({
                    name: data[i]['一级分类'],
                    value: data[i][current_indicator_global]
                })
                area_arr.push({
                    name: data[i]['一级分类'],
                    xValue: getFormatValues('交易总金额', data[i]['交易总金额']),
                    yValue: getFormatValues('笔均交易金额', data[i]['笔均交易金额']),
                    rate: data[i]['笔均交易金额较2023年同比增长率']
                })
            }
        }
        // console.log(area, arr);
        // 渲染
        drawMapRank("map-area-rank-chart", arr, area, "area-rank-h3")

        data = overall_data['整体情况-各城区']
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                updateAreaValues(data[i], area)
            }
        }

        // update bubble chart
        // get max min
        let data_arr = area_arr.map(({ rate }) => Math.abs(rate))
        const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
        // const max_v = 2.63, min_v = 0
        // reconstruct the data
        let x_dataInterval = [0, 0.05, 0.1, 1, 5, 10, 12], y_dataInterval = [0, 10, 100, 500, 5000, 10000]
        let x_interval = (x_dataInterval[x_dataInterval.length - 1] - x_dataInterval[0]) / (x_dataInterval.length - 1), y_interval = (y_dataInterval[y_dataInterval.length - 1] - y_dataInterval[0]) / (y_dataInterval.length - 1)
        let filteredUp = [], filteredDown = [];
        for (let i = 0; i < area_arr.length; i++) {
            let interval_min_v = Math.max(...x_dataInterval.filter(v => v <= area_arr[i].xValue));
            let interval_max_v = Math.min(...x_dataInterval.filter(v => v > area_arr[i].xValue));
            let index = x_dataInterval.findIndex(v => v === interval_min_v);
            let x_value = (((area_arr[i].xValue - interval_min_v) / (interval_max_v - interval_min_v)) * x_interval) + index * x_interval;

            index = Math.floor(area_arr[i].yValue / y_interval)
            interval_min_v = Math.max(...y_dataInterval.filter(v => v <= area_arr[i].yValue));
            interval_max_v = Math.min(...y_dataInterval.filter(v => v > area_arr[i].yValue));
            index = y_dataInterval.findIndex(v => v === interval_min_v);
            let y_value = (((area_arr[i].yValue - interval_min_v) / (interval_max_v - interval_min_v)) * y_interval) + index * y_interval;
            if (area_arr[i].rate > 0) {
                filteredUp.push([x_value, y_value, Math.abs(area_arr[i].rate), i, area_arr[i].name])
            } else {
                filteredDown.push([x_value, y_value, Math.abs(area_arr[i].rate), i, area_arr[i].name])
            }
        }
        tab_charts_arr["bubbleChart"].setOption({
            tooltip: {
                formatter: function (param) {
                    let index = param.value[3]
                    // console.log(index, dataBJ[index]);
                    // prettier-ignore
                    return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                        + area_arr[index].name
                        + '</div>'
                        + '交易总金额：' + formatValues('交易总金额', area_arr[index].xValue) + '<br>'
                        + '笔均交易金额：' + formatValues('笔均交易金额', area_arr[index].yValue) + '<br>'
                        + '同比' + (area_arr[index].rate > 0 ? '增加' : '下降') + '：' + area_arr[index].rate.toLocaleString('zh-CN', options_percent) + '<br>';
                }
            },
            visualMap: [
                {
                    min: min_v,
                    max: max_v,
                }
            ],
            series: [
                {
                    data: filteredUp,
                    label: {
                        formatter: param => {
                            let index = param.value[3]
                            return area_arr[index].name;
                        },
                    }
                },
                {
                    data: filteredDown,
                    label: {
                        formatter: param => {
                            let index = param.value[3]
                            return area_arr[index].name;
                        },
                    }
                }
            ]
        });


        data = overall_data['分城区-二级分类']
        let business = document.getElementById("area-business-rank-h3").innerHTML.split("-")[1].split(" ")[0]
        arr = []
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area && data[i]['一级分类'] === business) {
                arr.push({
                    name: data[i]['二级分类'],
                    value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
                })
            }
        }
        drawMapRank('area-business-rank-chart', arr, area + "-" + business, "area-business-rank-h3")
        console.log('759', area, business);
    });
    tab_charts_arr["mapAreaChart"] = mychart
}

// drawMap('map-area-chart')
// drawMap('map-business-chart')

function drawHeatmap(id, data) {
    // get max min
    let data_arr = data.map(({ value }) => value)
    const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
    // get heapmap data
    let heat_data = []
    for (let i = 0; i < data.length; i++) {
        heat_data.push([data[i].lng, data[i].lat, data[i].value, i])
    }
    // console.log(min_v, max_v);
    // 基于准备好的dom，初始化echarts实例
    let mychart = echarts.init(document.getElementById(id))
    // 监听屏幕变化自动缩放图表
    window.addEventListener('resize', function () {
        mychart.resize()
    })
    // 绘制图表
    mychart.setOption({
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
                let index = val.data[3]
                // console.log(val.data[3], data[index], data[index].value);
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + data[index].area + ' - ' + data[index].name
                    + '</div>'
                    + current_indicator_global + ': ' + formatValues(current_indicator_global, data[index].value)
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
            splitNumber: 5,
            // 定义在选中范围中的视觉元素
            inRange: {
                // 图元的颜色
                color: ['blue', 'blue', 'green', 'yellow', 'red']
                // ['#d94e5d', '#eac736', '#50a3ba'].reverse()
            },
            right: "right"
        },
        geo: {
            // 类型
            type: 'map',
            // 系列名称，用于tooltip的显示，legend 的图例筛选 在 setOption 更新数据和配置项时用于指定对应的系列
            map: '北京',
            // 地图类型
            mapType: 'province',
            label: {
                emphasis: {
                    show: false
                }
            },
            zoom: 1.2,
            roam: true,
            itemStyle: {
                normal: {
                    areaColor: '#323c48',
                    borderColor: '#111'
                },
                emphasis: {
                    areaColor: '#2a333d'
                }
            }
        },
        series: [
            {
                name: '热力图',
                type: 'heatmap',
                coordinateSystem: 'geo',
                data: heat_data,
                pointSize: 10,
                blurSize: 6,
                zlevel: 99
            },
            {
                name: '散点图', // series名称
                type: 'scatter', // series图表类型
                coordinateSystem: 'geo', // series坐标系类型
                symbolSize: 10,
                itemStyle: {
                    opacity: 0,
                },
                data: heat_data
            }
        ]
    })
    mychart.on("click", function (params) { //点击事件
        // console.log('我被点击了', params)
        // 读取数据
        let data = overall_data['商圈'], arr = []
        let area = params.name
        if (area == '') return
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area) {
                arr.push({
                    name: data[i]['商圈名'],
                    value: data[i][current_indicator_global]
                })
            }
        }
        drawMapRank('map-business-rank-chart', arr, area, "business-rank-h3")
    });
    tab_charts_arr["mapBusinessChart"] = mychart
}

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
                // console.log(val);
                return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                    + val.name
                    + '</div>'
                    + current_indicator_global + ': ' + formatValues(current_indicator_global, val.data)
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
                },
                formatter: function (val) {
                    // console.log(val);
                    // return val.value.toFixed(2)
                    return formatValues(current_indicator_global, val.value)
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
    rankChart.on("click", function (params) { //点击事件
        // console.log('我被点击了', params)
        // 读取数据
        let data = overall_data['分城区-一级分类'],
            arr = [],
            area_arr = []
        let area = params.name
        document.getElementById('bubble-h3').innerHTML = area + " - 分城区"
        for (let i = 0; i < data.length; i++) {
            if (data[i]['一级分类'] === area) {
                area_arr.push({
                    name: data[i]['城区'],
                    xValue: getFormatValues('交易总金额', data[i]['交易总金额']),
                    yValue: getFormatValues('笔均交易金额', data[i]['笔均交易金额']),
                    rate: data[i]['笔均交易金额较2023年同比增长率']
                })
            }
        }

        // update bubble chart
        // get max min
        let data_arr = area_arr.map(({ rate }) => Math.abs(rate))
        const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
        // const max_v = 2.63, min_v = 0
        // reconstruct the data
        let x_dataInterval = [0, 0.05, 0.1, 1, 5, 10, 12], y_dataInterval = [0, 10, 100, 500, 5000, 10000]
        let x_interval = (x_dataInterval[x_dataInterval.length - 1] - x_dataInterval[0]) / (x_dataInterval.length - 1), y_interval = (y_dataInterval[y_dataInterval.length - 1] - y_dataInterval[0]) / (y_dataInterval.length - 1)
        let filteredUp = [], filteredDown = [];
        for (let i = 0; i < area_arr.length; i++) {
            let interval_min_v = Math.max(...x_dataInterval.filter(v => v <= area_arr[i].xValue));
            let interval_max_v = Math.min(...x_dataInterval.filter(v => v > area_arr[i].xValue));
            let index = x_dataInterval.findIndex(v => v === interval_min_v);
            let x_value = (((area_arr[i].xValue - interval_min_v) / (interval_max_v - interval_min_v)) * x_interval) + index * x_interval;

            index = Math.floor(area_arr[i].yValue / y_interval)
            interval_min_v = Math.max(...y_dataInterval.filter(v => v <= area_arr[i].yValue));
            interval_max_v = Math.min(...y_dataInterval.filter(v => v > area_arr[i].yValue));
            index = y_dataInterval.findIndex(v => v === interval_min_v);
            let y_value = (((area_arr[i].yValue - interval_min_v) / (interval_max_v - interval_min_v)) * y_interval) + index * y_interval;
            if (area_arr[i].rate > 0) {
                filteredUp.push([x_value, y_value, Math.abs(area_arr[i].rate), i, area_arr[i].name])
            } else {
                filteredDown.push([x_value, y_value, Math.abs(area_arr[i].rate), i, area_arr[i].name])
            }
        }
        tab_charts_arr["bubbleChart"].setOption({
            tooltip: {
                formatter: function (param) {
                    let index = param.value[3]
                    // console.log(index, dataBJ[index]);
                    // prettier-ignore
                    return '<div style="border-bottom: 1px solid rgba(255,255,255,.8); font-size: 18px;padding-bottom: 7px;margin-bottom: 7px">'
                        + area_arr[index].name
                        + '</div>'
                        + '交易总金额：' + formatValues('交易总金额', area_arr[index].xValue) + '<br>'
                        + '笔均交易金额：' + formatValues('笔均交易金额', area_arr[index].yValue) + '<br>'
                        + '同比' + (area_arr[index].rate > 0 ? '增加' : '下降') + '：' + area_arr[index].rate.toLocaleString('zh-CN', options_percent) + '<br>';
                }
            },
            visualMap: [
                {
                    min: min_v,
                    max: max_v,
                }
            ],
            series: [
                {
                    data: filteredUp,
                    label: {
                        formatter: param => {
                            let index = param.value[3]
                            return area_arr[index].name;
                        },
                    }
                },
                {
                    data: filteredDown,
                    label: {
                        formatter: param => {
                            let index = param.value[3]
                            return area_arr[index].name;
                        },
                    }
                }
            ]
        });

        data = overall_data['分城区-二级分类']
        let business = area
        area = document.getElementById("area-business-rank-h3").innerHTML.split("-")[0]
        arr = []
        for (let i = 0; i < data.length; i++) {
            if (data[i]['城区'] === area && data[i]['一级分类'] === business) {
                arr.push({
                    name: data[i]['二级分类'],
                    value: getFormatValues(current_indicator_global, data[i][current_indicator_global])
                })
            }
        }
        drawMapRank('area-business-rank-chart', arr, area + "-" + business, "area-business-rank-h3")
        console.log('1140', area, business);
    });
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

function drawMapRank(id, data, areaName, h3id) {
    if (h3id === "area-rank-h3") {
        document.getElementById(h3id).innerHTML = areaName + "内行业排名"
    } else if (h3id === "business-rank-h3") {
        document.getElementById(h3id).innerHTML = areaName + "内商圈排名"
    } else {
        document.getElementById(h3id).innerHTML = areaName + " 二级分类排名"
    }
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
        span.innerHTML = "No." + (+i + 1) + " " + data[i].name + "：" + formatValues(current_indicator_global, data[i].value)
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

    // get max min
    let data_arr = data.map(({ rate }) => Math.abs(rate))
    const max_v = Math.max(...data_arr), min_v = Math.min(...data_arr)
    // const max_v = 2.63, min_v = 0

    // reconstruct the data
    let x_dataInterval = [0, 0.05, 0.1, 1, 5, 10, 12], y_dataInterval = [0, 10, 100, 500, 5000, 10000]
    let x_interval = (x_dataInterval[x_dataInterval.length - 1] - x_dataInterval[0]) / (x_dataInterval.length - 1), y_interval = (y_dataInterval[y_dataInterval.length - 1] - y_dataInterval[0]) / (y_dataInterval.length - 1)
    // console.log(x_dataInterval, y_dataInterval, x_interval, y_interval);
    let filteredUp = [], filteredDown = [];
    for (let i = 0; i < data.length; i++) {
        // 寻找在数据间隔里小于amount的最大值
        let interval_min_v = Math.max(...x_dataInterval.filter(v => v <= data[i].xValue));
        // 寻找在数据间隔里大于amount的最小值
        let interval_max_v = Math.min(...x_dataInterval.filter(v => v > data[i].xValue));
        let index = x_dataInterval.findIndex(v => v === interval_min_v);
        // 计算该x在x轴上应该展示的位置
        let x_value = (((data[i].xValue - interval_min_v) / (interval_max_v - interval_min_v)) * x_interval) + index * x_interval;
        // console.log(data[i].xValue, x_interval, x_value, index, interval_min_v, interval_max_v);

        index = Math.floor(data[i].yValue / y_interval)
        // 寻找在数据间隔里小于amount的最大值
        interval_min_v = Math.max(...y_dataInterval.filter(v => v <= data[i].yValue));
        // 寻找在数据间隔里大于amount的最小值
        interval_max_v = Math.min(...y_dataInterval.filter(v => v > data[i].yValue));
        index = y_dataInterval.findIndex(v => v === interval_min_v);
        // 计算该amount在y轴上应该展示的位置
        let y_value = (((data[i].yValue - interval_min_v) / (interval_max_v - interval_min_v)) * y_interval) + index * y_interval;
        // console.log(data[i].xValue, x_value, data[i].yValue, y_value, index, interval_min_v, interval_max_v);
        if (data[i].rate > 0) {
            filteredUp.push([x_value, y_value, Math.abs(data[i].rate), i, data[i].name])
        } else {
            filteredDown.push([x_value, y_value, Math.abs(data[i].rate), i, data[i].name])
        }
    }

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
    // let filteredUp = [], filteredDown = [];
    // for (let i = 0; i < data.length; i++) {
    //     if (data[i].rate > 0) {
    //         filteredUp.push([data[i].xValue, data[i].yValue, Math.abs(data[i].rate), i])
    //     } else {
    //         filteredDown.push([data[i].xValue, data[i].yValue, Math.abs(data[i].rate), i])
    //     }
    // }
    // console.log(filteredUp, filteredDown);
    const itemStyle = {
        opacity: 0.8,
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowColor: 'rgba(0,0,0,0.3)'
    };
    option = {
        width: '80%',
        // height: '100%',
        color: ['#FF0000', '#00FF00'],
        legend: {
            top: '5%',
            left: '10%',
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
                    + data[index].name
                    + '</div>'
                    + '交易总金额：' + formatValues('交易总金额', data[index].xValue) + '<br>'
                    + '笔均交易金额：' + formatValues('笔均交易金额', data[index].yValue) + '<br>'
                    + '同比' + (data[index].rate > 0 ? '增加' : '下降') + '：' + data[index].rate.toLocaleString('zh-CN', options_percent) + '<br>';
            }
        },
        xAxis: {
            type: 'value',
            name: '交易总金额/亿元',
            nameLocation: 'center',
            // nameGap: 16,
            nameTextStyle: {
                fontSize: 16,
                padding: [10, 0, 0, 300]// 四个数字分别为上右下左与原位置距离
            },
            // min: 'dataMin',
            max: x_dataInterval[x_dataInterval.length - 1],
            splitNumber: x_dataInterval.length,
            splitLine: {
                show: false
            },
            axisLabel: {
                formatter: function (v, i) {
                    // console.log('x', v, i);
                    return x_dataInterval[i]
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '笔均交易金额/元',
            nameLocation: 'end',
            nameGap: 20,
            nameTextStyle: {
                fontSize: 16,
                padding: [0, 0, 0, 30]// 四个数字分别为上右下左与原位置距离
            },
            splitLine: {
                show: false
            },
            max: y_dataInterval[y_dataInterval.length - 1],
            splitNumber: y_dataInterval.length,
            axisLabel: {
                formatter: function (v, i) {
                    // console.log('y', v, i);
                    return y_dataInterval[i]
                }
            }
        },
        visualMap: [
            {
                // show: false,
                right: '0%',
                top: '3%',
                orient: 'horizontal',
                // align: 'left',
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
                calculable: false,
                precision: 2,
                text: ['圆形大小：变化幅度'],
                textGap: 10,
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
                },
                formatter: function (value) { //标签的格式化工具。
                    return value.toLocaleString('zh-CN', options_percent)
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
                        return data[index].name;
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
                        return data[index].name;
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
    myChart.on("click", function (params) { //点击事件
        // console.log('我被点击了', params)
        // 读取数据
        let origin_data = overall_data['分城区-二级分类'],
            arr = []
        let area = params.value[4], business
        // console.log(area.slice(area.length - 1, area.length));
        if (area.slice(area.length - 1, area.length) === '区') {
            business = document.getElementById("area-business-rank-h3").innerHTML.split("-")[1].split(" ")[0]
        } else {
            business = area
            area = document.getElementById("area-business-rank-h3").innerHTML.split("-")[0]
        }
        // console.log(area, business);

        for (let i = 0; i < origin_data.length; i++) {
            if (origin_data[i]['城区'] === area && origin_data[i]['一级分类'] === business) {
                arr.push({
                    name: origin_data[i]['二级分类'],
                    value: getFormatValues(current_indicator_global, origin_data[i][current_indicator_global])
                })
            }
        }
        drawMapRank('area-business-rank-chart', arr, area + "-" + business, "area-business-rank-h3")
        console.log('1779', area, business);
    });

    tab_charts_arr["bubbleChart"] = myChart
}
// drawScatterplot()

function showSankeyDiagram() {
    if (document.getElementById("detail-business-div").style.display === 'none') {
        document.getElementById("detail-business-div").style.display = 'flex'
    } else {
        document.getElementById("detail-business-div").style.display = 'none'
    }

}

function drawSankeyDiagram(node, links) {
    console.log(node, links);

    var chartDom = document.getElementById('sankey-chart');
    var myChart = echarts.init(chartDom);
    var option;

    option = {
        series: {
            type: 'sankey',
            layout: 'none',
            emphasis: {
                focus: 'adjacency'
            },
            data: node,
            links: links,
            nodeGap: 16,
            label: {
                show: true,
                formatter: param => {
                    return param.data.name.split("-")[0];
                },
                // position: 'right',
                // 文本样式
                textStyle: {
                    // 字体大小
                    fontSize: 12,
                    fontFamily: 'Microsoft YaHei',
                    // 字体颜色
                    color: 'white',
                }
            },
            //线条样式
            lineStyle: {
                normal: {
                    color: 'gradient',
                    curveness: 0.5,
                    opacity: 0.6
                }
            }
        }
    };

    option && myChart.setOption(option);
    // 4.让图表随屏幕自适应
    window.addEventListener('resize', function () {
        myChart.resize();
    })
    tab_charts_arr["bubbleChart"] = myChart

}
// drawSankeyDiagram()