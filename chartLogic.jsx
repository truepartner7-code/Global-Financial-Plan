const { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;

const ChartComponent = ({ data, plan }) => {
    if (!data || data.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div style={{ height: 350, background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', textAlign: 'center' }}>📈 원금 vs 해약환급금 추이 (손익분기점 분석)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="year" tickFormatter={(v) => `${v}년`} stroke="#94a3b8" />
                        <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="#94a3b8" />
                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} labelFormatter={(label) => `${label}년차`} />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="principal" name="누적 원금" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="refund" name="해약환급금" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            {plan !== 'none' && (
                <div style={{ height: 350, background: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1e293b', textAlign: 'center' }}>📊 누적 인출액 및 잔여 환급금 (인출 시나리오)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="year" tickFormatter={(v) => `${v}년`} stroke="#94a3b8" />
                            <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} stroke="#94a3b8" />
                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} labelFormatter={(label) => `${label}년차`} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="withdrawal" stackId="a" name="누적 인출액" fill="#10b981" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="sv" stackId="a" name="잔여 환급금" fill="#64748b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

let chartRoot = null;
window.renderCharts = function(chartData, plan) {
    const rootNode = document.getElementById('recharts-root');
    if (rootNode) {
        if (!chartRoot) {
            chartRoot = ReactDOM.createRoot(rootNode);
        }
        chartRoot.render(<ChartComponent data={chartData} plan={plan} />);
        document.getElementById('chart-section').style.display = 'block';
    }
};
