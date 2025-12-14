// 投资组合管理类
class PortfolioManager {
    constructor() {
        this.currentPeriod = '7d';
        this.allocationFilter = '按地区';
        
        // 模拟投资组合数据
        this.portfolioData = {
            totalInvestment: 125340,
            totalValue: 135185,
            totalReturn: 9845,
            returnRate: 7.85
        };

        // 模拟持仓数据
        this.holdings = [
            {
                id: 1,
                name: "纽约曼哈顿商业区",
                investment: 45000,
                currentValue: 48600,
                return: 3600,
                returnRate: 8.0,
                shares: 450,
                location: "美国 · 纽约",
                type: "商业地产"
            },
            {
                id: 2,
                name: "伦敦金融城办公区",
                investment: 35000,
                currentValue: 37450,
                return: 2450,
                returnRate: 7.0,
                shares: 350,
                location: "英国 · 伦敦",
                type: "商业地产"
            },
            {
                id: 3,
                name: "东京银座商业区",
                investment: 25340,
                currentValue: 26880,
                return: 1540,
                returnRate: 6.1,
                shares: 254,
                location: "日本 · 东京",
                type: "零售地产"
            },
            {
                id: 4,
                name: "新加坡CBD写字楼",
                investment: 20000,
                currentValue: 22255,
                return: 2255,
                returnRate: 11.3,
                shares: 200,
                location: "新加坡 · 滨海湾",
                type: "商业地产"
            }
        ];

        // 模拟交易历史
        this.transactions = [
            {
                id: 1,
                type: 'buy',
                assetName: '纽约曼哈顿商业区',
                amount: 45000,
                shares: 450,
                price: 100,
                date: '2024-01-15',
                status: 'completed'
            },
            {
                id: 2,
                type: 'buy',
                assetName: '伦敦金融城办公区',
                amount: 35000,
                shares: 350,
                price: 100,
                date: '2024-01-20',
                status: 'completed'
            },
            {
                id: 3,
                type: 'dividend',
                assetName: '纽约曼哈顿商业区',
                amount: 180,
                shares: 450,
                date: '2024-02-01',
                status: 'completed'
            },
            {
                id: 4,
                type: 'buy',
                assetName: '东京银座商业区',
                amount: 25340,
                shares: 254,
                price: 99.76,
                date: '2024-02-10',
                status: 'completed'
            },
            {
                id: 5,
                type: 'buy',
                assetName: '新加坡CBD写字楼',
                amount: 20000,
                shares: 200,
                price: 100,
                date: '2024-02-15',
                status: 'completed'
            },
            {
                id: 6,
                type: 'dividend',
                assetName: '伦敦金融城办公区',
                amount: 122.5,
                shares: 350,
                date: '2024-03-01',
                status: 'completed'
            }
        ];

        this.init();
    }

    init() {
        this.updateSummaryCards();
        this.renderHoldings();
        this.renderTransactionHistory();
        this.initCharts();
        this.bindEvents();
    }

    updateSummaryCards() {
        document.getElementById('totalInvestment').textContent = 
            `$${this.formatNumber(this.portfolioData.totalInvestment)}`;
        document.getElementById('totalReturn').textContent = 
            `+$${this.formatNumber(this.portfolioData.totalReturn)}`;
        document.getElementById('returnRate').textContent = 
            `+${this.portfolioData.returnRate}%`;
    }

    renderHoldings() {
        // 渲染表格视图
        const tableBody = document.getElementById('holdingsTableBody');
        if (tableBody) {
            tableBody.innerHTML = this.holdings.map(holding => `
                <tr>
                    <td>
                        <div class="asset-name">
                            <strong>${holding.name}</strong>
                            <br>
                            <small>${holding.location}</small>
                        </div>
                    </td>
                    <td>$${this.formatNumber(holding.investment)}</td>
                    <td>$${this.formatNumber(holding.currentValue)}</td>
                    <td class="${holding.return >= 0 ? 'positive' : 'negative'}">
                        ${holding.return >= 0 ? '+' : ''}$${this.formatNumber(holding.return)}
                    </td>
                    <td class="${holding.returnRate >= 0 ? 'positive' : 'negative'}">
                        ${holding.returnRate >= 0 ? '+' : ''}${holding.returnRate}%
                    </td>
                    <td>${holding.shares}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="portfolioManager.buyMore(${holding.id})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="portfolioManager.sell(${holding.id})">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // 渲染卡片视图（移动端）
        const cardsContainer = document.getElementById('holdingsCards');
        if (cardsContainer) {
            cardsContainer.innerHTML = this.holdings.map(holding => `
                <div class="holding-card">
                    <div class="holding-header">
                        <div class="holding-title">${holding.name}</div>
                        <div class="holding-badge ${holding.returnRate >= 0 ? 'positive' : 'negative'}">
                            ${holding.returnRate >= 0 ? '+' : ''}${holding.returnRate}%
                        </div>
                    </div>
                    <p class="asset-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${holding.location}
                    </p>
                    <div class="holding-details">
                        <div class="holding-detail">
                            <span class="detail-label">投资金额</span>
                            <span class="detail-value">$${this.formatNumber(holding.investment)}</span>
                        </div>
                        <div class="holding-detail">
                            <span class="detail-label">当前价值</span>
                            <span class="detail-value">$${this.formatNumber(holding.currentValue)}</span>
                        </div>
                        <div class="holding-detail">
                            <span class="detail-label">收益</span>
                            <span class="detail-value ${holding.return >= 0 ? 'positive' : 'negative'}">
                                ${holding.return >= 0 ? '+' : ''}$${this.formatNumber(holding.return)}
                            </span>
                        </div>
                        <div class="holding-detail">
                            <span class="detail-label">份额</span>
                            <span class="detail-value">${holding.shares}</span>
                        </div>
                    </div>
                    <div class="holding-actions">
                        <button class="btn btn-sm btn-outline" onclick="portfolioManager.buyMore(${holding.id})">
                            <i class="fas fa-plus"></i>
                            增持
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="portfolioManager.sell(${holding.id})">
                            <i class="fas fa-minus"></i>
                            减持
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    renderTransactionHistory() {
        const timeline = document.getElementById('transactionTimeline');
        if (!timeline) return;

        const sortedTransactions = [...this.transactions].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );

        timeline.innerHTML = sortedTransactions.map(transaction => `
            <div class="timeline-item">
                <div class="timeline-marker ${transaction.type}"></div>
                <div class="timeline-content">
                    <div class="timeline-header">
                        <span class="timeline-type ${transaction.type}">
                            ${this.getTransactionTypeLabel(transaction.type)}
                        </span>
                        <span class="timeline-date">${this.formatDate(transaction.date)}</span>
                    </div>
                    <div class="timeline-title">${transaction.assetName}</div>
                    <div class="timeline-details">
                        <div>
                            <strong>金额:</strong> $${this.formatNumber(transaction.amount)}
                        </div>
                        ${transaction.shares ? `
                            <div>
                                <strong>份额:</strong> ${transaction.shares}
                            </div>
                        ` : ''}
                        ${transaction.price ? `
                            <div>
                                <strong>价格:</strong> $${transaction.price}
                            </div>
                        ` : ''}
                        <div>
                            <strong>状态:</strong> 
                            <span class="status ${transaction.status}">${this.getStatusLabel(transaction.status)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    initCharts() {
        this.initPortfolioChart();
        this.initAllocationChart();
    }

    initPortfolioChart() {
        const canvas = document.getElementById('portfolioChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // 生成模拟数据
        const data = this.generatePortfolioChartData(this.currentPeriod);
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        this.drawGrid(ctx, canvas.width, canvas.height);
        
        // 绘制折线图
        this.drawLineChart(ctx, data, canvas.width, canvas.height);
        
        // 绘制数据点
        this.drawDataPoints(ctx, data, canvas.width, canvas.height);
    }

    initAllocationChart() {
        const canvas = document.getElementById('allocationChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const data = this.getAllocationData();
        
        // 绘制饼图
        this.drawPieChart(ctx, data, canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 3);
        
        // 更新图例
        this.updateAllocationLegend(data);
    }

    generatePortfolioChartData(period) {
        const dataPoints = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const data = [];
        const baseValue = this.portfolioData.totalInvestment;
        
        for (let i = 0; i < dataPoints; i++) {
            const progress = i / (dataPoints - 1);
            const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% 随机变化
            const trendGrowth = progress * (this.portfolioData.returnRate / 100);
            const value = baseValue * (1 + trendGrowth + randomVariation);
            data.push({
                x: i,
                y: value,
                date: this.getDateForPeriod(period, i)
            });
        }
        
        return data;
    }

    getAllocationData() {
        if (this.allocationFilter === '按地区') {
            const regions = {};
            this.holdings.forEach(holding => {
                const region = holding.location.split(' · ')[0];
                if (!regions[region]) {
                    regions[region] = 0;
                }
                regions[region] += holding.currentValue;
            });
            
            return Object.entries(regions).map(([region, value], index) => ({
                label: region,
                value: value,
                percentage: (value / this.portfolioData.totalValue * 100).toFixed(1),
                color: this.getColorForIndex(index)
            }));
        } else if (this.allocationFilter === '按类型') {
            const types = {};
            this.holdings.forEach(holding => {
                if (!types[holding.type]) {
                    types[holding.type] = 0;
                }
                types[holding.type] += holding.currentValue;
            });
            
            return Object.entries(types).map(([type, value], index) => ({
                label: type,
                value: value,
                percentage: (value / this.portfolioData.totalValue * 100).toFixed(1),
                color: this.getColorForIndex(index)
            }));
        }
        
        return [];
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        // 垂直网格线
        for (let i = 0; i <= 10; i++) {
            const x = (width * i) / 10;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 水平网格线
        for (let i = 0; i <= 5; i++) {
            const y = (height * i) / 5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawLineChart(ctx, data, width, height) {
        if (data.length === 0) return;
        
        const minY = Math.min(...data.map(d => d.y));
        const maxY = Math.max(...data.map(d => d.y));
        const yRange = maxY - minY;
        
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        
        ctx.beginPath();
        data.forEach((point, index) => {
            const x = (width * index) / (data.length - 1);
            const y = height - ((point.y - minY) / yRange * height);
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        // 绘制线条
        ctx.stroke();
        
        // 填充区域
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    drawDataPoints(ctx, data, width, height) {
        if (data.length === 0) return;
        
        const minY = Math.min(...data.map(d => d.y));
        const maxY = Math.max(...data.map(d => d.y));
        const yRange = maxY - minY;
        
        ctx.fillStyle = '#6366f1';
        
        data.forEach((point, index) => {
            const x = (width * index) / (data.length - 1);
            const y = height - ((point.y - minY) / yRange * height);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
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
            ctx.lineWidth = 2;
            ctx.stroke();
            
            currentAngle += sliceAngle;
        });
    }

    updateAllocationLegend(data) {
        const legend = document.getElementById('allocationLegend');
        if (!legend) return;
        
        legend.innerHTML = data.map(item => `
            <div class="legend-item">
                <div class="legend-color" style="background-color: ${item.color}"></div>
                <span class="legend-label">${item.label}</span>
                <span class="legend-value">${item.percentage}%</span>
            </div>
        `).join('');
    }

    bindEvents() {
        // 图表时间段切换
        const periodButtons = document.querySelectorAll('.btn-tab[data-period]');
        periodButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                periodButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                this.initPortfolioChart();
            });
        });

        // 资产分布筛选
        const allocationSelect = document.querySelector('.allocation-filter select');
        if (allocationSelect) {
            allocationSelect.addEventListener('change', (e) => {
                this.allocationFilter = e.target.value;
                this.initAllocationChart();
            });
        }

        // 导出报告
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        // 重新平衡
        const rebalanceBtn = document.getElementById('rebalanceBtn');
        if (rebalanceBtn) {
            rebalanceBtn.addEventListener('click', () => this.showRebalanceModal());
        }
    }

    buyMore(holdingId) {
        const holding = this.holdings.find(h => h.id === holdingId);
        if (!holding) return;

        const modal = window.realEstateETF?.createModal('增持资产', `
            <div class="buy-more-modal">
                <div class="asset-summary">
                    <h4>${holding.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${holding.location}</p>
                    <div class="current-holding">
                        <div class="holding-stat">
                            <span class="label">当前持有</span>
                            <span class="value">${holding.shares} 份</span>
                        </div>
                        <div class="holding-stat">
                            <span class="label">当前价值</span>
                            <span class="value">$${this.formatNumber(holding.currentValue)}</span>
                        </div>
                    </div>
                </div>
                <div class="buy-form">
                    <div class="form-group">
                        <label class="form-label">增持金额 (USD)</label>
                        <input type="number" id="buyAmount" class="form-input" 
                               placeholder="输入增持金额" min="1000" value="5000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">预计份额</label>
                        <input type="text" id="estimatedShares" class="form-input" readonly>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" 
                            onclick="portfolioManager.processBuyMore(${holdingId})">
                        <i class="fas fa-plus"></i>
                        确认增持
                    </button>
                </div>
            </div>
        `);

        // 绑定金额变化事件
        const amountInput = document.getElementById('buyAmount');
        const sharesInput = document.getElementById('estimatedShares');
        
        const updateShares = () => {
            const amount = parseFloat(amountInput.value) || 0;
            const currentPrice = holding.currentValue / holding.shares;
            const estimatedShares = Math.floor(amount / currentPrice);
            sharesInput.value = `${estimatedShares} 份`;
        };

        amountInput.addEventListener('input', updateShares);
        updateShares();
    }

    sell(holdingId) {
        const holding = this.holdings.find(h => h.id === holdingId);
        if (!holding) return;

        const modal = window.realEstateETF?.createModal('减持资产', `
            <div class="sell-modal">
                <div class="asset-summary">
                    <h4>${holding.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${holding.location}</p>
                    <div class="current-holding">
                        <div class="holding-stat">
                            <span class="label">当前持有</span>
                            <span class="value">${holding.shares} 份</span>
                        </div>
                        <div class="holding-stat">
                            <span class="label">当前价值</span>
                            <span class="value">$${this.formatNumber(holding.currentValue)}</span>
                        </div>
                    </div>
                </div>
                <div class="sell-form">
                    <div class="form-group">
                        <label class="form-label">减持份额</label>
                        <input type="number" id="sellShares" class="form-input" 
                               placeholder="输入减持份额" min="1" max="${holding.shares}" value="100">
                    </div>
                    <div class="form-group">
                        <label class="form-label">预计收入</label>
                        <input type="text" id="estimatedIncome" class="form-input" readonly>
                    </div>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 1rem;" 
                            onclick="portfolioManager.processSell(${holdingId})">
                        <i class="fas fa-minus"></i>
                        确认减持
                    </button>
                </div>
            </div>
        `);

        // 绑定份额变化事件
        const sharesInput = document.getElementById('sellShares');
        const incomeInput = document.getElementById('estimatedIncome');
        
        const updateIncome = () => {
            const shares = parseInt(sharesInput.value) || 0;
            const currentPrice = holding.currentValue / holding.shares;
            const estimatedIncome = shares * currentPrice;
            incomeInput.value = `$${this.formatNumber(estimatedIncome)}`;
        };

        sharesInput.addEventListener('input', updateIncome);
        updateIncome();
    }

    processBuyMore(holdingId) {
        const amount = parseFloat(document.getElementById('buyAmount').value);
        const holding = this.holdings.find(h => h.id === holdingId);
        
        if (!amount || amount < 1000) {
            window.realEstateETF?.showNotification('最小增持金额为 $1,000', 'warning');
            return;
        }

        if (!window.realEstateETF?.walletConnected) {
            window.realEstateETF?.showNotification('请先连接钱包', 'warning');
            return;
        }

        // 模拟增持流程
        window.realEstateETF?.showNotification('正在处理增持交易...', 'info');
        
        setTimeout(() => {
            const currentPrice = holding.currentValue / holding.shares;
            const newShares = Math.floor(amount / currentPrice);
            
            // 更新持仓数据
            holding.investment += amount;
            holding.shares += newShares;
            holding.currentValue = holding.shares * currentPrice;
            holding.return = holding.currentValue - holding.investment;
            holding.returnRate = (holding.return / holding.investment * 100);
            
            // 更新总投资数据
            this.portfolioData.totalInvestment += amount;
            this.portfolioData.totalValue = this.holdings.reduce((sum, h) => sum + h.currentValue, 0);
            this.portfolioData.totalReturn = this.portfolioData.totalValue - this.portfolioData.totalInvestment;
            this.portfolioData.returnRate = (this.portfolioData.totalReturn / this.portfolioData.totalInvestment * 100);
            
            // 添加交易记录
            this.transactions.unshift({
                id: this.transactions.length + 1,
                type: 'buy',
                assetName: holding.name,
                amount: amount,
                shares: newShares,
                price: currentPrice,
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            });
            
            window.realEstateETF?.showNotification(
                `成功增持 ${newShares} 份 ${holding.name}！`, 
                'success'
            );
            window.realEstateETF?.closeModal();
            
            // 更新页面
            this.updateSummaryCards();
            this.renderHoldings();
            this.renderTransactionHistory();
            this.initCharts();
        }, 2000);
    }

    processSell(holdingId) {
        const shares = parseInt(document.getElementById('sellShares').value);
        const holding = this.holdings.find(h => h.id === holdingId);
        
        if (!shares || shares <= 0 || shares > holding.shares) {
            window.realEstateETF?.showNotification('请输入有效的减持份额', 'warning');
            return;
        }

        if (!window.realEstateETF?.walletConnected) {
            window.realEstateETF?.showNotification('请先连接钱包', 'warning');
            return;
        }

        // 模拟减持流程
        window.realEstateETF?.showNotification('正在处理减持交易...', 'info');
        
        setTimeout(() => {
            const currentPrice = holding.currentValue / holding.shares;
            const sellValue = shares * currentPrice;
            const sellInvestment = (shares / holding.shares) * holding.investment;
            
            // 更新持仓数据
            holding.investment -= sellInvestment;
            holding.shares -= shares;
            holding.currentValue = holding.shares * currentPrice;
            holding.return = holding.currentValue - holding.investment;
            holding.returnRate = holding.investment > 0 ? (holding.return / holding.investment * 100) : 0;
            
            // 更新总投资数据
            this.portfolioData.totalInvestment -= sellInvestment;
            this.portfolioData.totalValue = this.holdings.reduce((sum, h) => sum + h.currentValue, 0);
            this.portfolioData.totalReturn = this.portfolioData.totalValue - this.portfolioData.totalInvestment;
            this.portfolioData.returnRate = (this.portfolioData.totalReturn / this.portfolioData.totalInvestment * 100);
            
            // 添加交易记录
            this.transactions.unshift({
                id: this.transactions.length + 1,
                type: 'sell',
                assetName: holding.name,
                amount: sellValue,
                shares: shares,
                price: currentPrice,
                date: new Date().toISOString().split('T')[0],
                status: 'completed'
            });
            
            window.realEstateETF?.showNotification(
                `成功减持 ${shares} 份 ${holding.name}，获得 $${this.formatNumber(sellValue)}！`, 
                'success'
            );
            window.realEstateETF?.closeModal();
            
            // 更新页面
            this.updateSummaryCards();
            this.renderHoldings();
            this.renderTransactionHistory();
            this.initCharts();
        }, 2000);
    }

    exportReport() {
        // 生成投资组合报告
        const report = {
            summary: this.portfolioData,
            holdings: this.holdings,
            transactions: this.transactions,
            generatedAt: new Date().toISOString()
        };

        // 创建下载链接
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        window.realEstateETF?.showNotification('投资组合报告已导出', 'success');
    }

    showRebalanceModal() {
        const modal = window.realEstateETF?.createModal('重新平衡投资组合', `
            <div class="rebalance-modal">
                <p class="modal-description">
                    根据市场表现和投资目标，系统建议对您的投资组合进行重新平衡。
                </p>
                
                <div class="rebalance-suggestions">
                    <h4>建议调整:</h4>
                    <div class="suggestion-item">
                        <span class="asset-name">纽约曼哈顿商业区</span>
                        <span class="current-allocation">当前: 36.0%</span>
                        <span class="suggested-allocation">建议: 30.0%</span>
                        <span class="action sell">减持 6.0%</span>
                    </div>
                    <div class="suggestion-item">
                        <span class="asset-name">新加坡CBD写字楼</span>
                        <span class="current-allocation">当前: 16.5%</span>
                        <span class="suggested-allocation">建议: 25.0%</span>
                        <span class="action buy">增持 8.5%</span>
                    </div>
                </div>
                
                <div class="rebalance-benefits">
                    <h4>预期收益:</h4>
                    <ul>
                        <li>降低投资组合风险</li>
                        <li>优化收益率预期</li>
                        <li>提高投资多样性</li>
                    </ul>
                </div>
                
                <div class="rebalance-actions">
                    <button class="btn btn-outline" onclick="window.realEstateETF.closeModal()">
                        稍后处理
                    </button>
                    <button class="btn btn-primary" onclick="portfolioManager.executeRebalance()">
                        执行重新平衡
                    </button>
                </div>
            </div>
        `);
    }

    executeRebalance() {
        window.realEstateETF?.showNotification('正在执行投资组合重新平衡...', 'info');
        
        setTimeout(() => {
            window.realEstateETF?.showNotification('投资组合重新平衡完成！', 'success');
            window.realEstateETF?.closeModal();
            
            // 这里可以添加实际的重新平衡逻辑
            // 更新持仓数据和重新渲染
        }, 3000);
    }

    // 工具函数
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

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getDateForPeriod(period, index) {
        const now = new Date();
        const daysAgo = period === '7d' ? 7 - index : 
                       period === '30d' ? 30 - index :
                       period === '90d' ? 90 - index : 365 - index;
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
    }

    getTransactionTypeLabel(type) {
        const labels = {
            'buy': '买入',
            'sell': '卖出',
            'dividend': '分红'
        };
        return labels[type] || type;
    }

    getStatusLabel(status) {
        const labels = {
            'completed': '已完成',
            'pending': '处理中',
            'failed': '失败'
        };
        return labels[status] || status;
    }

    getColorForIndex(index) {
        const colors = [
            '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'
        ];
        return colors[index % colors.length];
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioManager = new PortfolioManager();
    console.log('📈 投资组合页面已加载完成');
});

// 添加额外样式
const portfolioStyles = document.createElement('style');
portfolioStyles.textContent = `
    .asset-name {
        line-height: 1.4;
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .action-buttons .btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }

    .status.completed {
        color: var(--success-color);
    }

    .status.pending {
        color: var(--warning-color);
    }

    .status.failed {
        color: var(--error-color);
    }

    .current-holding {
        display: flex;
        gap: 2rem;
        margin: 1rem 0;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
    }

    .holding-stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .holding-stat .label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .holding-stat .value {
        font-weight: 600;
        color: var(--text-primary);
    }

    .rebalance-suggestions {
        margin: 1.5rem 0;
    }

    .suggestion-item {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 0.75rem;
        margin-bottom: 0.5rem;
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        font-size: 0.875rem;
    }

    .suggestion-item .asset-name {
        font-weight: 600;
    }

    .suggestion-item .action.buy {
        color: var(--success-color);
        font-weight: 600;
    }

    .suggestion-item .action.sell {
        color: var(--error-color);
        font-weight: 600;
    }

    .rebalance-benefits {
        margin: 1.5rem 0;
    }

    .rebalance-benefits ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    .rebalance-benefits li {
        margin-bottom: 0.25rem;
        color: var(--text-secondary);
    }

    .rebalance-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    .rebalance-actions .btn {
        flex: 1;
    }

    .modal-description {
        color: var(--text-secondary);
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }

    @media (max-width: 768px) {
        .current-holding {
            flex-direction: column;
            gap: 1rem;
        }

        .suggestion-item {
            grid-template-columns: 1fr;
            gap: 0.5rem;
        }

        .rebalance-actions {
            flex-direction: column;
        }
    }
`;

document.head.appendChild(portfolioStyles); 