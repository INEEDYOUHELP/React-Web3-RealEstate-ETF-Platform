// 数据分析管理类
class AnalyticsManager {
    constructor() {
        this.currentTimeRange = '90d';
        this.currentMetric = 'price';
        
        // 模拟市场数据
        this.marketData = {
            totalMarketCap: 2540000000,
            tradingVolume: 89500000,
            activeAssets: 156,
            activeUsers: 15200,
            marketCapChange: 5.2,
            volumeChange: -2.1,
            assetsChange: 3,
            usersChange: 8.9
        };

        // 模拟排行榜数据
        this.rankingData = {
            gainers: [
                { rank: 1, name: '迪拜商业中心', symbol: 'DUB-BIZ', change: 12.5 },
                { rank: 2, name: '新加坡CBD写字楼', symbol: 'SIN-CBD', change: 8.9 },
                { rank: 3, name: '纽约曼哈顿商业区', symbol: 'NYC-COMM', change: 6.7 },
                { rank: 4, name: '首尔江南区综合体', symbol: 'SEO-GAN', change: 5.2 },
                { rank: 5, name: '悉尼海港城住宅', symbol: 'SYD-HAR', change: 4.8 }
            ],
            losers: [
                { rank: 1, name: '伦敦金融城办公区', symbol: 'LON-FIN', change: -3.2 },
                { rank: 2, name: '法兰克福商务区', symbol: 'FRA-BIZ', change: -2.8 },
                { rank: 3, name: '巴黎香榭丽舍', symbol: 'PAR-CHA', change: -2.1 },
                { rank: 4, name: '米兰时尚区', symbol: 'MIL-FAS', change: -1.9 },
                { rank: 5, name: '马德里商业区', symbol: 'MAD-BIZ', change: -1.5 }
            ],
            volume: [
                { rank: 1, name: '纽约曼哈顿商业区', symbol: 'NYC-COMM', volume: 15600000 },
                { rank: 2, name: '伦敦金融城办公区', symbol: 'LON-FIN', volume: 12400000 },
                { rank: 3, name: '东京银座商业区', symbol: 'TOK-GIN', volume: 9800000 },
                { rank: 4, name: '新加坡CBD写字楼', symbol: 'SIN-CBD', volume: 8500000 },
                { rank: 5, name: '迪拜商业中心', symbol: 'DUB-BIZ', volume: 7200000 }
            ]
        };

        // 模拟图表数据
        this.chartData = {
            regions: [
                { region: '北美', value: 40, color: '#6366f1' },
                { region: '欧洲', value: 30, color: '#10b981' },
                { region: '亚太', value: 25, color: '#f59e0b' },
                { region: '中东', value: 5, color: '#ef4444' }
            ],
            yields: [
                { range: '0-3%', count: 12 },
                { range: '3-6%', count: 35 },
                { range: '6-9%', count: 45 },
                { range: '9-12%', count: 28 },
                { range: '12%+', count: 8 }
            ]
        };

        this.init();
    }

    init() {
        this.updateMetrics();
        this.renderRankings();
        this.initCharts();
        this.bindEvents();
        this.updateIndicators();
    }

    bindEvents() {
        // 时间范围切换
        const timeRangeSelect = document.getElementById('timeRange');
        if (timeRangeSelect) {
            timeRangeSelect.addEventListener('change', (e) => {
                this.currentTimeRange = e.target.value;
                this.refreshCharts();
            });
        }

        // 图表指标切换
        const chartBtns = document.querySelectorAll('.chart-btn');
        chartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMetric(e.target.dataset.metric);
            });
        });

        // 导出数据
        const exportBtn = document.getElementById('exportData');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // 生成报告
        const generateReportBtn = document.getElementById('generateReport');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateReport());
        }

        // 地区分布筛选
        const regionFilter = document.querySelector('.chart-filter select');
        if (regionFilter) {
            regionFilter.addEventListener('change', () => this.updateRegionChart());
        }
    }

    updateMetrics() {
        // 更新市场概览数据
        document.getElementById('totalMarketCap').textContent = `$${this.formatNumber(this.marketData.totalMarketCap)}`;
        document.getElementById('tradingVolume').textContent = `$${this.formatNumber(this.marketData.tradingVolume)}`;
        document.getElementById('activeAssets').textContent = this.marketData.activeAssets;
        document.getElementById('activeUsers').textContent = `${this.formatNumber(this.marketData.activeUsers)}`;

        // 更新变化百分比
        this.updateMetricChange('.metric-card:nth-child(1)', this.marketData.marketCapChange, '本周');
        this.updateMetricChange('.metric-card:nth-child(2)', this.marketData.volumeChange, '昨日');
        this.updateMetricChange('.metric-card:nth-child(3)', this.marketData.assetsChange, '新增', true);
        this.updateMetricChange('.metric-card:nth-child(4)', this.marketData.usersChange, '本月');
    }

    updateMetricChange(selector, change, period, isCount = false) {
        const metricCard = document.querySelector(selector);
        const changeElement = metricCard.querySelector('.metric-change');
        
        if (isCount) {
            changeElement.textContent = `+${change} ${period}`;
            changeElement.className = 'metric-change positive';
        } else {
            const sign = change >= 0 ? '+' : '';
            changeElement.textContent = `${sign}${change.toFixed(1)}% ${period}`;
            changeElement.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
    }

    renderRankings() {
        // 渲染涨幅榜
        const gainersRanking = document.getElementById('gainersRanking');
        if (gainersRanking) {
            gainersRanking.innerHTML = this.rankingData.gainers.map(item => `
                <div class="ranking-item">
                    <div class="ranking-rank">${item.rank}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${item.name}</div>
                        <div class="ranking-symbol">${item.symbol}</div>
                    </div>
                    <div class="ranking-value positive">+${item.change.toFixed(1)}%</div>
                </div>
            `).join('');
        }

        // 渲染跌幅榜
        const losersRanking = document.getElementById('losersRanking');
        if (losersRanking) {
            losersRanking.innerHTML = this.rankingData.losers.map(item => `
                <div class="ranking-item">
                    <div class="ranking-rank">${item.rank}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${item.name}</div>
                        <div class="ranking-symbol">${item.symbol}</div>
                    </div>
                    <div class="ranking-value negative">${item.change.toFixed(1)}%</div>
                </div>
            `).join('');
        }

        // 渲染交易量榜
        const volumeRanking = document.getElementById('volumeRanking');
        if (volumeRanking) {
            volumeRanking.innerHTML = this.rankingData.volume.map(item => `
                <div class="ranking-item">
                    <div class="ranking-rank">${item.rank}</div>
                    <div class="ranking-info">
                        <div class="ranking-name">${item.name}</div>
                        <div class="ranking-symbol">${item.symbol}</div>
                    </div>
                    <div class="ranking-value">$${this.formatNumber(item.volume)}</div>
                </div>
            `).join('');
        }
    }

    initCharts() {
        this.initTrendChart();
        this.initRegionChart();
        this.initYieldChart();
        this.initRiskReturnChart();
    }

    initTrendChart() {
        const canvas = document.getElementById('trendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.generateTrendData(this.currentTimeRange, this.currentMetric);
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        this.drawGrid(ctx, canvas.width, canvas.height);
        
        // 绘制趋势线
        this.drawTrendLine(ctx, data, canvas.width, canvas.height);
        
        // 绘制数据点
        this.drawDataPoints(ctx, data, canvas.width, canvas.height);
        
        // 绘制标签
        this.drawAxisLabels(ctx, data, canvas.width, canvas.height);
    }

    initRegionChart() {
        const canvas = document.getElementById('regionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 3;
        
        // 绘制饼图
        this.drawPieChart(ctx, this.chartData.regions, centerX, centerY, radius);
        
        // 更新图例
        this.updateRegionLegend();
    }

    initYieldChart() {
        const canvas = document.getElementById('yieldChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // 绘制柱状图
        this.drawBarChart(ctx, this.chartData.yields, canvas.width, canvas.height);
    }

    initRiskReturnChart() {
        const canvas = document.getElementById('riskReturnChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // 模拟风险回报数据
        const riskReturnData = [
            { risk: 15, return: 6.5, name: '纽约曼哈顿', size: 125 },
            { risk: 12, return: 7.2, name: '伦敦金融城', size: 98 },
            { risk: 18, return: 8.9, name: '新加坡CBD', size: 156 },
            { risk: 20, return: 10.5, name: '迪拜商业', size: 178 },
            { risk: 10, return: 5.8, name: '洛杉矶住宅', size: 234 },
            { risk: 14, return: 6.8, name: '东京银座', size: 87 }
        ];
        
        // 绘制散点图
        this.drawScatterChart(ctx, riskReturnData, canvas.width, canvas.height);
    }

    generateTrendData(timeRange, metric) {
        const dataPoints = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const data = [];
        
        // 根据指标类型生成不同的基础值
        let baseValue;
        switch (metric) {
            case 'price':
                baseValue = 100;
                break;
            case 'volume':
                baseValue = 50000000;
                break;
            case 'market-cap':
                baseValue = 2000000000;
                break;
            default:
                baseValue = 100;
        }
        
        for (let i = 0; i < dataPoints; i++) {
            const progress = i / (dataPoints - 1);
            const trend = 0.05 * progress; // 5% 整体增长趋势
            const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% 随机波动
            const value = baseValue * (1 + trend + randomVariation);
            
            data.push({
                x: i,
                y: value,
                date: this.getDateForTimeRange(timeRange, i)
            });
        }
        
        return data;
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        // 垂直网格线
        for (let i = 1; i < 10; i++) {
            const x = (width * i) / 10;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 水平网格线
        for (let i = 1; i < 8; i++) {
            const y = (height * i) / 8;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }

    drawTrendLine(ctx, data, width, height) {
        if (data.length === 0) return;
        
        const minY = Math.min(...data.map(d => d.y));
        const maxY = Math.max(...data.map(d => d.y));
        const yRange = maxY - minY;
        const padding = 20;
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.1)');
        
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 绘制线条
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = padding + ((width - 2 * padding) * index) / (data.length - 1);
            const y = height - padding - ((point.y - minY) / yRange * (height - 2 * padding));
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // 填充区域
        const firstPoint = data[0];
        const lastPoint = data[data.length - 1];
        const firstX = padding;
        const lastX = padding + ((width - 2 * padding) * (data.length - 1)) / (data.length - 1);
        
        ctx.lineTo(lastX, height - padding);
        ctx.lineTo(firstX, height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    drawDataPoints(ctx, data, width, height) {
        if (data.length === 0) return;
        
        const minY = Math.min(...data.map(d => d.y));
        const maxY = Math.max(...data.map(d => d.y));
        const yRange = maxY - minY;
        const padding = 20;
        
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        data.forEach((point, index) => {
            const x = padding + ((width - 2 * padding) * index) / (data.length - 1);
            const y = height - padding - ((point.y - minY) / yRange * (height - 2 * padding));
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }

    drawAxisLabels(ctx, data, width, height) {
        const padding = 20;
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        // X轴标签（日期）
        const labelCount = Math.min(data.length, 5);
        for (let i = 0; i < labelCount; i++) {
            const dataIndex = Math.floor((data.length - 1) * i / (labelCount - 1));
            const point = data[dataIndex];
            const x = padding + ((width - 2 * padding) * dataIndex) / (data.length - 1);
            
            ctx.fillText(point.date, x, height - 5);
        }
    }

    drawPieChart(ctx, data, centerX, centerY, radius) {
        let currentAngle = 0;
        const total = data.reduce((sum, item) => sum + item.value, 0);
        
        data.forEach(item => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            
            // 绘制扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = item.color;
            ctx.fill();
            
            // 绘制边框
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
    }

    drawBarChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        const maxCount = Math.max(...data.map(d => d.count));
        
        ctx.fillStyle = '#6366f1';
        
        data.forEach((item, index) => {
            const barHeight = (item.count / maxCount) * chartHeight;
            const x = padding + index * (barWidth + barSpacing);
            const y = height - padding - barHeight;
            
            // 绘制柱子
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // 绘制标签
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(item.range, x + barWidth / 2, height - 10);
            ctx.fillText(item.count.toString(), x + barWidth / 2, y - 5);
            
            ctx.fillStyle = '#6366f1';
        });
    }

    drawScatterChart(ctx, data, width, height) {
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        const maxRisk = Math.max(...data.map(d => d.risk));
        const maxReturn = Math.max(...data.map(d => d.return));
        const maxSize = Math.max(...data.map(d => d.size));
        
        // 绘制坐标轴
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // 绘制数据点
        data.forEach(point => {
            const x = padding + (point.risk / maxRisk) * chartWidth;
            const y = height - padding - (point.return / maxReturn) * chartHeight;
            const radius = 5 + (point.size / maxSize) * 10;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
            ctx.fill();
            ctx.strokeStyle = '#6366f1';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // 绘制轴标签
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('风险 (%)', width / 2, height - 10);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('回报 (%)', 0, 0);
        ctx.restore();
    }

    updateRegionLegend() {
        const legend = document.getElementById('regionLegend');
        if (!legend) return;
        
        legend.innerHTML = this.chartData.regions.map(region => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${region.color}"></div>
                <span class="legend-label">${region.region}</span>
                <span class="legend-value">${region.value}%</span>
            </div>
        `).join('');
    }

    updateRegionChart() {
        // 这里可以根据筛选条件更新地区分布数据
        this.initRegionChart();
    }

    switchMetric(metric) {
        this.currentMetric = metric;
        
        // 更新按钮状态
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-metric="${metric}"]`).classList.add('active');
        
        // 重新绘制趋势图
        this.initTrendChart();
    }

    refreshCharts() {
        this.initTrendChart();
        this.updateIndicators();
    }

    updateIndicators() {
        // 更新技术指标
        const indicators = {
            sentiment: 72 + Math.random() * 10 - 5,
            volatility: 15.8 + Math.random() * 4 - 2,
            liquidity: 86 + Math.random() * 8 - 4,
            correlation: 0.65 + Math.random() * 0.2 - 0.1
        };
        
        document.getElementById('sentimentIndex').textContent = Math.round(indicators.sentiment);
        document.getElementById('volatilityIndex').textContent = indicators.volatility.toFixed(1) + '%';
        document.getElementById('liquidityIndex').textContent = Math.round(indicators.liquidity);
        document.getElementById('correlationIndex').textContent = indicators.correlation.toFixed(2);
        
        // 更新进度条
        document.querySelector('#sentimentIndex').parentNode.parentNode.querySelector('.gauge-fill').style.width = indicators.sentiment + '%';
        document.querySelector('#volatilityIndex').parentNode.parentNode.querySelector('.gauge-fill').style.width = (indicators.volatility / 50 * 100) + '%';
        document.querySelector('#liquidityIndex').parentNode.parentNode.querySelector('.gauge-fill').style.width = indicators.liquidity + '%';
        document.querySelector('#correlationIndex').parentNode.parentNode.querySelector('.gauge-fill').style.width = (indicators.correlation * 100) + '%';
    }

    exportData() {
        const exportData = {
            marketOverview: this.marketData,
            rankings: this.rankingData,
            chartData: this.chartData,
            timeRange: this.currentTimeRange,
            exportTime: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        window.realEstateETF?.showNotification('数据导出成功！', 'success');
    }

    generateReport() {
        const modal = window.realEstateETF?.createModal('生成分析报告', `
            <div class="report-generator">
                <div class="generator-options">
                    <h4>报告配置</h4>
                    <div class="form-group">
                        <label class="form-label">报告类型</label>
                        <select class="form-select" id="reportType">
                            <option value="market">市场总览报告</option>
                            <option value="performance">表现分析报告</option>
                            <option value="risk">风险评估报告</option>
                            <option value="forecast">趋势预测报告</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">时间范围</label>
                        <select class="form-select" id="reportTimeRange">
                            <option value="7d">近7天</option>
                            <option value="30d">近30天</option>
                            <option value="90d" selected>近90天</option>
                            <option value="1y">近1年</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">包含内容</label>
                        <div class="checkbox-group">
                            <label class="checkbox-item">
                                <input type="checkbox" checked> 市场概览
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" checked> 排行榜数据
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" checked> 技术指标
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox"> 详细图表
                            </label>
                        </div>
                    </div>
                </div>
                <div class="generator-preview">
                    <h4>报告预览</h4>
                    <div class="preview-content">
                        <div class="preview-item">
                            <i class="fas fa-chart-bar"></i>
                            <span>市场概览数据</span>
                        </div>
                        <div class="preview-item">
                            <i class="fas fa-trophy"></i>
                            <span>表现排行榜</span>
                        </div>
                        <div class="preview-item">
                            <i class="fas fa-gauge"></i>
                            <span>技术指标分析</span>
                        </div>
                        <div class="preview-item">
                            <i class="fas fa-file-pdf"></i>
                            <span>PDF格式输出</span>
                        </div>
                    </div>
                </div>
                <div class="generator-actions">
                    <button class="btn btn-outline" onclick="window.realEstateETF.closeModal()">
                        取消
                    </button>
                    <button class="btn btn-primary" onclick="window.analyticsManager.processReportGeneration()">
                        <i class="fas fa-file-alt"></i>
                        生成报告
                    </button>
                </div>
            </div>
        `);
    }

    processReportGeneration() {
        window.realEstateETF?.showNotification('正在生成分析报告...', 'info');
        
        setTimeout(() => {
            window.realEstateETF?.showNotification('分析报告生成完成！', 'success');
            window.realEstateETF?.closeModal();
            
            // 模拟下载报告
            const reportData = `
房地产ETF市场分析报告
生成时间: ${new Date().toLocaleString()}

=== 市场概览 ===
总市值: $${this.formatNumber(this.marketData.totalMarketCap)}
24小时交易量: $${this.formatNumber(this.marketData.tradingVolume)}
活跃资产数量: ${this.marketData.activeAssets}
活跃用户数量: ${this.formatNumber(this.marketData.activeUsers)}

=== 涨幅榜 TOP 5 ===
${this.rankingData.gainers.map(item => 
    `${item.rank}. ${item.name} (${item.symbol}): +${item.change.toFixed(1)}%`
).join('\n')}

=== 技术指标 ===
市场情绪指数: 72 (乐观)
波动率指数: 15.8% (中等)
流动性指数: 86 (良好)
相关性指数: 0.65 (中度相关)

本报告由房地产ETF平台自动生成
            `;
            
            const blob = new Blob([reportData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `realestate-etf-report-${new Date().toISOString().split('T')[0]}.txt`;
            link.click();
            URL.revokeObjectURL(url);
        }, 2000);
    }

    getDateForTimeRange(timeRange, index) {
        const now = new Date();
        const daysAgo = timeRange === '7d' ? 7 - index : 
                       timeRange === '30d' ? 30 - index :
                       timeRange === '90d' ? 90 - index : 365 - index;
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }

    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        } else if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.round(num).toLocaleString();
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsManager = new AnalyticsManager();
    console.log('📊 数据分析页面已加载完成');
});

// 添加额外样式
const analyticsStyles = document.createElement('style');
analyticsStyles.textContent = `
    .report-generator {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        max-width: 800px;
    }

    .generator-options {
        border-right: 1px solid var(--border-color);
        padding-right: 2rem;
    }

    .generator-options h4,
    .generator-preview h4 {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }

    .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .checkbox-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .preview-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .preview-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
    }

    .preview-item i {
        color: var(--primary-color);
        font-size: 1.25rem;
    }

    .generator-actions {
        grid-column: 1 / -1;
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }

    .generator-actions .btn {
        flex: 1;
    }

    .ranking-value.positive {
        color: var(--success-color);
    }

    .ranking-value.negative {
        color: var(--error-color);
    }

    .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
    }

    .legend-label {
        flex: 1;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .legend-value {
        font-weight: 600;
        color: var(--text-primary);
    }

    @media (max-width: 768px) {
        .report-generator {
            grid-template-columns: 1fr;
        }

        .generator-options {
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            padding-right: 0;
            padding-bottom: 1rem;
        }
    }
`;

document.head.appendChild(analyticsStyles); 