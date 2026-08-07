'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('original');
  const [metric, setMetric] = useState('gross');
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Dynamic filter dropdown toggle states
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'date' | 'viewBy' | 'dayOfWeek' | 'compare' | null>(null);

  // Filter selection states
  const [selectedRangeLabel, setSelectedRangeLabel] = useState('Last 7 days');
  const [startDateInput, setStartDateInput] = useState('2026-07-02');
  const [endDateInput, setEndDateInput] = useState('2026-07-08');
  const [selectedViewBy, setSelectedViewBy] = useState('Day');

  // Interactive Range Picker calendar states
  const [rangeStart, setRangeStart] = useState<string | null>('2026-07-02');
  const [rangeEnd, setRangeEnd] = useState<string | null>('2026-07-08');

  // Interactive Comparison Range Picker calendar states (Screenshot 4)
  const [compareActive, setCompareActive] = useState(false);
  const [comparePresetLabel, setComparePresetLabel] = useState('Previous period');
  const [compareStartInput, setCompareStartInput] = useState('2025-06-03');
  const [compareEndInput, setCompareEndInput] = useState('2025-07-07');
  const [compareRangeStart, setCompareRangeStart] = useState<string | null>('2025-06-03');
  const [compareRangeEnd, setCompareRangeEnd] = useState<string | null>('2025-07-07');
  
  // Day of week checklist states
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    Monday: true,
    Tuesday: true,
    Wednesday: true,
    Thursday: true,
    Friday: true,
    Saturday: true,
    Sunday: true,
  });

  // Tooltip hover state
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [hoveredHourIndex, setHoveredHourIndex] = useState<number | null>(null);

  // Main 7-day dataset (Jul 2 - Jul 8) with comparative offset sales
  const salesSummaryData = [
    { date: 'Thu, Jul 2, 2026', shortDate: 'Jul 2', dayName: 'Thursday', sales: 580.00, compareSales: 420.00, orders: 22, covers: 48 },
    { date: 'Fri, Jul 3, 2026', shortDate: 'Jul 3', dayName: 'Friday', sales: 1151.30, compareSales: 890.00, orders: 43, covers: 92 },
    { date: 'Sat, Jul 4, 2026', shortDate: 'Jul 4', dayName: 'Saturday', sales: 480.00, compareSales: 350.00, orders: 18, covers: 36 },
    { date: 'Sun, Jul 5, 2026', shortDate: 'Jul 5', dayName: 'Sunday', sales: 0.00, compareSales: 0.00, orders: 0, covers: 0 },
    { date: 'Mon, Jul 6, 2026', shortDate: 'Jul 6', dayName: 'Monday', sales: 520.90, compareSales: 410.00, orders: 20, covers: 42 },
    { date: 'Tue, Jul 7, 2026', shortDate: 'Jul 7', dayName: 'Tuesday', sales: 490.00, compareSales: 380.00, orders: 19, covers: 38 },
    { date: 'Wed, Jul 8, 2026', shortDate: 'Jul 8', dayName: 'Wednesday', sales: 790.00, compareSales: 620.00, orders: 31, covers: 64 },
  ];

  // Day of week totals dataset
  const dayOfWeekData = [
    { day: 'Mon', fullName: 'Monday', sales: 520.90 },
    { day: 'Tue', fullName: 'Tuesday', sales: 490.00 },
    { day: 'Wed', fullName: 'Wednesday', sales: 790.00 },
    { day: 'Thu', fullName: 'Thursday', sales: 580.00 },
    { day: 'Fri', fullName: 'Friday', sales: 1151.30 },
    { day: 'Sat', fullName: 'Saturday', sales: 480.00 },
    { day: 'Sun', fullName: 'Sunday', sales: 0.00 },
  ];

  // Time of day totals dataset
  const timeOfDayData = [
    { hour: '10 AM', sales: 60.00 },
    { hour: '11 AM', sales: 120.00 },
    { hour: '12 PM', sales: 620.00 },
    { hour: '1 PM', sales: 340.00 },
    { hour: '2 PM', sales: 380.00 },
    { hour: '3 PM', sales: 290.00 },
    { hour: '4 PM', sales: 310.00 },
    { hour: '5 PM', sales: 600.00 },
    { hour: '6 PM', sales: 850.00 },
    { hour: '7 PM', sales: 580.00 },
    { hour: '8 PM', sales: 110.00 },
  ];

  // Formatter for Currency
  const formatCurrency = (val: number) => {
    return '€' + val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Toggle dynamic filter dropdown
  const toggleFilterDropdown = (type: 'date' | 'viewBy' | 'dayOfWeek' | 'compare') => {
    setActiveFilterDropdown(prev => prev === type ? null : type);
  };

  // Handle click on calendar days (Main range)
  const handleCalendarDayClick = (dateStr: string) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(dateStr);
      setRangeEnd(null);
      setStartDateInput(dateStr);
    } else {
      if (new Date(dateStr) < new Date(rangeStart)) {
        setRangeStart(dateStr);
        setStartDateInput(dateStr);
      } else {
        setRangeEnd(dateStr);
        setEndDateInput(dateStr);
        setSelectedRangeLabel('Custom Range');
      }
    }
  };

  // Handle click on calendar days (Comparison range)
  const handleCompareDayClick = (dateStr: string) => {
    if (!compareRangeStart || (compareRangeStart && compareRangeEnd)) {
      setCompareRangeStart(dateStr);
      setCompareRangeEnd(null);
      setCompareStartInput(dateStr);
    } else {
      if (new Date(dateStr) < new Date(compareRangeStart)) {
        setCompareRangeStart(dateStr);
        setCompareStartInput(dateStr);
      } else {
        setCompareRangeEnd(dateStr);
        setCompareEndInput(dateStr);
        setComparePresetLabel('Custom Comparison');
      }
    }
  };

  // Get styling for Date Picker days
  const getDayStyle = (dateStr: string) => {
    const isStart = rangeStart === dateStr;
    const isEnd = rangeEnd === dateStr;
    const inRange = rangeStart && rangeEnd && new Date(dateStr) >= new Date(rangeStart) && new Date(dateStr) <= new Date(rangeEnd);

    if (isStart || isEnd) {
      return {
        backgroundColor: 'var(--accent-red)',
        color: 'white',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        fontWeight: 'bold',
      };
    }
    if (inRange) {
      return {
        backgroundColor: 'rgba(215, 25, 32, 0.25)',
        color: 'white',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
      };
    }
    return {
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      borderRadius: '4px',
    };
  };

  // Get styling for Comparison Picker days (Screenshot 4)
  const getCompareDayStyle = (dateStr: string) => {
    const isStart = compareRangeStart === dateStr;
    const isEnd = compareRangeEnd === dateStr;
    const inRange = compareRangeStart && compareRangeEnd && new Date(dateStr) >= new Date(compareRangeStart) && new Date(dateStr) <= new Date(compareRangeEnd);

    if (isStart || isEnd) {
      return {
        backgroundColor: '#444', // Dark grey circle in screenshot
        color: 'white',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
        fontWeight: 'bold',
      };
    }
    if (inRange) {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light grey wrapper pill shape in screenshot
        color: 'white',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '26px',
        height: '26px',
      };
    }
    return {
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '26px',
      height: '26px',
      borderRadius: '4px',
    };
  };

  // Toggle select status of a day
  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  // Count active days
  const activeDaysCount = Object.values(selectedDays).filter(Boolean).length;

  // Filter data based on day checklist
  const getFilteredSalesData = () => {
    return salesSummaryData.map(item => {
      const isVisible = selectedDays[item.dayName] !== false;
      return {
        ...item,
        sales: isVisible ? item.sales : 0,
        compareSales: isVisible ? item.compareSales : 0,
        orders: isVisible ? item.orders : 0,
        covers: isVisible ? item.covers : 0,
        isHidden: !isVisible,
      };
    });
  };

  const processedData = getFilteredSalesData();
  const currentTotalSum = processedData.reduce((acc, item) => acc + item.sales, 0);
  const currentCompareSum = processedData.reduce((acc, item) => acc + item.compareSales, 0);

  // Exporters
  const convertToCSV = (data: any[]) => {
    const headers = ['Date', 'Gross Sales', 'Orders', 'Covers'];
    const rows = data.map(item => [item.date, item.sales, item.orders, item.covers]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const convertToTSV = (data: any[]) => {
    const headers = ['Date', 'Gross Sales', 'Orders', 'Covers'];
    const rows = data.map(item => [item.date, item.sales, item.orders, item.covers]);
    return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
  };

  const handleDownload = (type: string) => {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `Sales_Summary_Report.${type}`;

    if (type === 'csv') {
      content = convertToCSV(salesSummaryData);
      mimeType = 'text/csv;charset=utf-8;';
    } else if (type === 'tsv') {
      content = convertToTSV(salesSummaryData);
      mimeType = 'text/tab-separated-values;charset=utf-8;';
    } else if (type === 'xlsx') {
      content = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet name="Sales Summary"><Table>` +
        `<Row><Cell><Data Type="String">Date</Data></Cell><Cell><Data Type="String">Gross Sales</Data></Cell><Cell><Data Type="String">Orders</Data></Cell></Row>` +
        salesSummaryData.map(item => `<Row><Cell><Data Type="String">${item.date}</Data></Cell><Cell><Data Type="Number">${item.sales}</Data></Cell><Cell><Data Type="Number">${item.orders}</Data></Cell></Row>`).join('') +
        `</Table></Worksheet></Workbook>`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `Sales_Summary_Report.xls`;
    } else if (type === 'pdf') {
      window.print();
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadDropdown(false);
  };

  return (
    <DashboardLayout>
      {/* Title Block */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="heading-bebas" style={{ fontSize: '2.4rem', color: 'var(--text-primary)', marginBottom: '4px', textTransform: 'none' }}>
          Sales summary
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Understand terms like <span style={{ textDecoration: 'underline', cursor: 'help' }}>Gross sales</span> and <span style={{ textDecoration: 'underline', cursor: 'help' }}>Net sales</span>.
        </p>
      </div>

      {/* Sub tabs bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '20px', gap: '20px' }}>
        <button 
          onClick={() => setActiveTab('original')}
          style={{ 
            padding: '10px 14px', 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'original' ? 'var(--accent-red)' : 'var(--text-muted)', 
            borderBottom: activeTab === 'original' ? '2px solid var(--accent-red)' : '2px solid transparent',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer' 
          }}
        >
          Original view
        </button>
        <button 
          onClick={() => setActiveTab('compare')}
          style={{ 
            padding: '10px 14px', 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'compare' ? 'var(--accent-red)' : 'var(--text-muted)', 
            borderBottom: activeTab === 'compare' ? '2px solid var(--accent-red)' : '2px solid transparent',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer' 
          }}
        >
          Vormonat vs. Vorjahr
        </button>
        <button 
          onClick={() => setActiveTab('more')}
          style={{ 
            padding: '10px 14px', 
            background: 'none', 
            border: 'none', 
            color: activeTab === 'more' ? 'var(--accent-red)' : 'var(--text-muted)', 
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer' 
          }}
        >
          More ⌵
        </button>
      </div>

      {/* Exporters and Download options */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '20px', position: 'relative' }}>
        {/* More actions */}
        <div>
          <button 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
            onClick={() => setShowMoreActions(!showMoreActions)}
          >
            More actions ⌵
          </button>
          {showMoreActions && (
            <div className="dashboard-card" style={{ position: 'absolute', right: '140px', top: '40px', zIndex: 10, width: '160px', padding: '8px 0', border: '1px solid var(--border)' }}>
              <button className="filter-tab" style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', color: 'white' }} onClick={() => { alert('Report scheduled.'); setShowMoreActions(false); }}>Schedule report</button>
              <button className="filter-tab" style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: 'none', border: 'none', color: 'white' }} onClick={() => { alert('Sent to Email.'); setShowMoreActions(false); }}>Email report</button>
            </div>
          )}
        </div>

        {/* Download drop-down */}
        <div>
          <button 
            className="btn btn-primary" 
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
          >
            <span>Download</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          
          {showDownloadDropdown && (
            <div className="dashboard-card" style={{ position: 'absolute', right: '0', top: '40px', zIndex: 10, width: '140px', padding: '8px 0', border: '1px solid var(--border)' }}>
              <button style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }} onClick={() => handleDownload('xlsx')}>XLSX (Excel)</button>
              <button style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }} onClick={() => handleDownload('csv')}>CSV (Standard)</button>
              <button style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }} onClick={() => handleDownload('pdf')}>PDF (Document)</button>
              <button style={{ display: 'block', width: '100%', padding: '8px 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left' }} onClick={() => handleDownload('tsv')}>TSV (Tab-spaced)</button>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Filters Bar with Custom Popups */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px', position: 'relative' }}>
        
        {/* Date Filter Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            className="form-select" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: activeFilterDropdown === 'date' ? 'var(--accent-red)' : '#111' }}
            onClick={() => toggleFilterDropdown('date')}
          >
            📅 {selectedRangeLabel}
          </button>

          {/* Date Picker PopUp Card (Image 3) */}
          {activeFilterDropdown === 'date' && (
            <div 
              className="dashboard-card" 
              style={{ 
                position: 'absolute', 
                left: '0', 
                top: '36px', 
                zIndex: 30, 
                width: '740px', 
                display: 'flex', 
                padding: '20px', 
                border: '2px solid var(--accent-red)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}
            >
              {/* Sidebar presets */}
              <div style={{ width: '160px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '16px' }}>
                {['Last 7 days', 'Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month', 'YTD', 'This year'].map(preset => (
                  <button 
                    key={preset}
                    onClick={() => {
                      setSelectedRangeLabel(preset);
                      if (preset === 'Today') { setStartDateInput('2026-07-08'); setEndDateInput('2026-07-08'); setRangeStart('2026-07-08'); setRangeEnd('2026-07-08'); }
                      else if (preset === 'Yesterday') { setStartDateInput('2026-07-07'); setEndDateInput('2026-07-07'); setRangeStart('2026-07-07'); setRangeEnd('2026-07-07'); }
                      else { setStartDateInput('2026-07-02'); setEndDateInput('2026-07-08'); setRangeStart('2026-07-02'); setRangeEnd('2026-07-08'); }
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '6px 10px',
                      background: selectedRangeLabel === preset ? 'rgba(215,25,32,0.1)' : 'none',
                      border: 'none',
                      color: selectedRangeLabel === preset ? 'var(--accent-red)' : 'var(--text-muted)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Calendar & Manual inputs */}
              <div style={{ flex: 1, paddingLeft: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>From</label>
                    <input type="date" className="form-input" value={startDateInput} onChange={(e) => { setStartDateInput(e.target.value); setRangeStart(e.target.value); }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>To</label>
                    <input type="date" className="form-input" value={endDateInput} onChange={(e) => { setEndDateInput(e.target.value); setRangeEnd(e.target.value); }} />
                  </div>
                </div>

                {/* Calendar grid visual with interactive selections */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.75rem', marginBottom: '20px' }}>
                  
                  {/* June Calendar (Starts Monday, 30 days) */}
                  <div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>June 2026</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 'bold' }}>S</span><span style={{ fontWeight: 'bold' }}>M</span><span style={{ fontWeight: 'bold' }}>T</span><span style={{ fontWeight: 'bold' }}>W</span><span style={{ fontWeight: 'bold' }}>T</span><span style={{ fontWeight: 'bold' }}>F</span><span style={{ fontWeight: 'bold' }}>S</span>
                      
                      {/* June 1 starts on Monday, so 1 empty cell on Sunday */}
                      <span></span>
                      {Array.from({ length: 30 }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `2026-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        return (
                          <span 
                            key={i} 
                            style={getDayStyle(dateStr)}
                            onClick={() => handleCalendarDayClick(dateStr)}
                          >
                            {dayNum}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* July Calendar (Starts Wednesday, 31 days) */}
                  <div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>July 2026</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 'bold' }}>S</span><span style={{ fontWeight: 'bold' }}>M</span><span style={{ fontWeight: 'bold' }}>T</span><span style={{ fontWeight: 'bold' }}>W</span><span style={{ fontWeight: 'bold' }}>T</span><span style={{ fontWeight: 'bold' }}>F</span><span style={{ fontWeight: 'bold' }}>S</span>
                      
                      {/* July 1 starts on Wednesday, so 3 empty cells (S, M, T) */}
                      <span></span><span></span><span></span>
                      {Array.from({ length: 31 }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `2026-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        return (
                          <span 
                            key={i} 
                            style={getDayStyle(dateStr)}
                            onClick={() => handleCalendarDayClick(dateStr)}
                          >
                            {dayNum}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => { setStartDateInput('2026-07-02'); setEndDateInput('2026-07-08'); setRangeStart('2026-07-02'); setRangeEnd('2026-07-08'); setSelectedRangeLabel('Last 7 days'); }}
                  >
                    Reset
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ width: 'auto', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setActiveFilterDropdown(null)}>Cancel</button>
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setActiveFilterDropdown(null)}>Apply</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compare with Selector Popup (Screenshot 4) */}
        <div style={{ position: 'relative' }}>
          <button 
            className="form-select" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: compareActive ? 'var(--accent-red)' : '#111' }}
            onClick={() => toggleFilterDropdown('compare')}
          >
            {compareActive ? `⚡ Compared: ${comparePresetLabel}` : 'Compare with'}
          </button>

          {/* Compare Selector Popup Card (Image 4/Screenshot 4) */}
          {activeFilterDropdown === 'compare' && (
            <div 
              className="dashboard-card" 
              style={{ 
                position: 'absolute', 
                left: '0', 
                top: '36px', 
                zIndex: 30, 
                width: '740px', 
                display: 'flex', 
                padding: '20px', 
                border: '2px solid var(--accent-red)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}
            >
              {/* Sidebar presets */}
              <div style={{ width: '180px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '16px' }}>
                {['Previous period', 'Same period previous year'].map(preset => (
                  <button 
                    key={preset}
                    onClick={() => {
                      setComparePresetLabel(preset);
                      if (preset === 'Previous period') { setCompareStartInput('2026-06-25'); setCompareEndInput('2026-07-01'); setCompareRangeStart('2026-06-25'); setCompareRangeEnd('2026-07-01'); }
                      else { setCompareStartInput('2025-06-03'); setCompareEndInput('2025-07-07'); setCompareRangeStart('2025-06-03'); setCompareRangeEnd('2025-07-07'); }
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      background: comparePresetLabel === preset ? 'rgba(215,25,32,0.1)' : 'none',
                      border: 'none',
                      color: comparePresetLabel === preset ? 'var(--accent-red)' : 'var(--text-muted)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Calendars & Manual inputs */}
              <div style={{ flex: 1, paddingLeft: '20px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>From</label>
                    <input type="date" className="form-input" value={compareStartInput} onChange={(e) => { setCompareStartInput(e.target.value); setCompareRangeStart(e.target.value); }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '0.65rem' }}>To</label>
                    <input type="date" className="form-input" value={compareEndInput} onChange={(e) => { setCompareEndInput(e.target.value); setCompareRangeEnd(e.target.value); }} />
                  </div>
                </div>

                {/* Calendar grid for Comparison (2025 comparison layout) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.75rem', marginBottom: '20px' }}>
                  {/* June 2025 */}
                  <div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>June 2025</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      
                      {/* June 1 2025 starts on Sunday, so 0 empty cells */}
                      {Array.from({ length: 30 }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `2025-06-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        return (
                          <span 
                            key={i} 
                            style={getCompareDayStyle(dateStr)}
                            onClick={() => handleCompareDayClick(dateStr)}
                          >
                            {dayNum}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* July 2025 */}
                  <div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '8px' }}>July 2025</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      
                      {/* July 1 2025 starts on Tuesday, so 2 empty cells */}
                      <span></span><span></span>
                      {Array.from({ length: 31 }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `2025-07-${dayNum < 10 ? '0' + dayNum : dayNum}`;
                        return (
                          <span 
                            key={i} 
                            style={getCompareDayStyle(dateStr)}
                            onClick={() => handleCompareDayClick(dateStr)}
                          >
                            {dayNum}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                    onClick={() => { setCompareActive(false); setCompareRangeStart(null); setCompareRangeEnd(null); setActiveFilterDropdown(null); }}
                  >
                    Clear comparison
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ width: 'auto', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => setActiveFilterDropdown(null)}>Cancel</button>
                    <button className="btn btn-primary" style={{ width: 'auto', padding: '6px 16px', fontSize: '0.8rem' }} onClick={() => { setCompareActive(true); setActiveFilterDropdown(null); }}>Apply</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View By Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            className="form-select" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: activeFilterDropdown === 'viewBy' ? 'var(--accent-red)' : '#111' }}
            onClick={() => toggleFilterDropdown('viewBy')}
          >
            By {selectedViewBy}
          </button>

          {/* View By Popup Card (Image 2) */}
          {activeFilterDropdown === 'viewBy' && (
            <div 
              className="dashboard-card" 
              style={{ 
                position: 'absolute', 
                left: '0', 
                top: '36px', 
                zIndex: 30, 
                width: '280px', 
                padding: '16px', 
                border: '2px solid var(--accent-red)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>View by</div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '14px' }}>Select a shorter date range for more options</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {['Hour', 'Day', 'Week', 'Month'].map(interval => (
                  <label key={interval} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: interval === 'Hour' ? 0.4 : 1 }}>
                    <input 
                      type="radio" 
                      name="viewByOption" 
                      checked={selectedViewBy === interval} 
                      disabled={interval === 'Hour'} 
                      onChange={() => setSelectedViewBy(interval)}
                      style={{ accentColor: 'var(--accent-red)' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: selectedViewBy === interval ? 'white' : 'var(--text-muted)' }}>
                      {interval}
                    </span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn btn-secondary" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => setActiveFilterDropdown(null)}>Cancel</button>
                <button className="btn btn-primary" style={{ width: 'auto', padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => setActiveFilterDropdown(null)}>Apply</button>
              </div>
            </div>
          )}
        </div>

        {/* Location selector */}
        <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}><option>All locations (1)</option></select>

        {/* Day of Week Filter Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            className="form-select" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', backgroundColor: activeFilterDropdown === 'dayOfWeek' ? 'var(--accent-red)' : '#111' }}
            onClick={() => toggleFilterDropdown('dayOfWeek')}
          >
            Day of week ({activeDaysCount})
          </button>

          {/* Day of Week Popup Card (Image 1) */}
          {activeFilterDropdown === 'dayOfWeek' && (
            <div 
              className="dashboard-card" 
              style={{ 
                position: 'absolute', 
                left: '0', 
                top: '36px', 
                zIndex: 30, 
                width: '240px', 
                padding: '16px', 
                border: '2px solid var(--accent-red)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.9)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                {Object.keys(selectedDays).map(day => (
                  <label key={day} className="checkbox-container" style={{ margin: '0' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedDays[day]} 
                      onChange={() => handleDayToggle(day)} 
                    />
                    <span className="checkmark"></span>
                    <span style={{ fontSize: '0.8rem', color: selectedDays[day] ? 'white' : 'var(--text-muted)' }}>{day}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button 
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                  onClick={() => setSelectedDays({ Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false, Saturday: false, Sunday: false })}
                >
                  Clear filters
                </button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-secondary" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => setActiveFilterDropdown(null)}>Cancel</button>
                  <button className="btn btn-primary" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => setActiveFilterDropdown(null)}>Apply</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>⚙ All filters</button>
      </div>

      {/* Main Graph Card Container */}
      <div className="dashboard-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Showing totals for all locations</span>
        
        <div className="flex-between" style={{ marginTop: '10px', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gross sales Updated: 12:27 PM</div>
            <div className="heading-bebas" style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginTop: '4px' }}>
              {selectedRangeLabel === 'Last 7 days' ? 'Jul 2 – 8, 2026' : selectedRangeLabel} <span style={{ color: 'var(--accent-gold)' }}>{formatCurrency(currentTotalSum)}</span>
              {compareActive && (
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '12px', fontWeight: 'normal' }}>
                  vs Previous: {formatCurrency(currentCompareSum)}
                </span>
              )}
            </div>
          </div>
          
          <select 
            className="form-select" 
            style={{ width: '130px', padding: '6px 12px', fontSize: '0.8rem' }}
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
          >
            <option value="gross">Gross sales</option>
            <option value="orders">Orders count</option>
          </select>
        </div>

        {/* Dynamic 7-Day Bar Chart with Comparison Overlays */}
        <div style={{ position: 'relative', height: '240px', borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {processedData.map((data, index) => {
            const heightPercentage = data.sales > 0 ? (data.sales / 1200) * 100 : 2;
            const compHeightPct = data.compareSales > 0 ? (data.compareSales / 1200) * 100 : 2;
            return (
              <div 
                key={data.shortDate} 
                style={{ 
                  width: '10%', 
                  height: '100%', 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  alignItems: 'center',
                  position: 'relative',
                  opacity: data.isHidden ? 0.15 : 1,
                  gap: '4px' // Gap between main and compare bars
                }}
                onMouseEnter={() => !data.isHidden && setHoveredBarIndex(index)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                {/* Comparison Bar (rendered when comparison is active) */}
                {compareActive && (
                  <div 
                    style={{
                      width: '45%',
                      height: `${compHeightPct}%`,
                      backgroundColor: 'rgba(255,255,255,0.15)', // Muted grey representation
                      borderRadius: '2px 2px 0 0',
                      transition: 'all 0.15s ease',
                    }}
                    title={`Previous Sales: €${data.compareSales}`}
                  ></div>
                )}

                {/* Visual Main Bar */}
                <div 
                  style={{
                    width: compareActive ? '50%' : '100%',
                    height: `${heightPercentage}%`,
                    backgroundColor: hoveredBarIndex === index ? 'var(--accent-red)' : 'rgba(215, 25, 32, 0.7)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.15s ease',
                    cursor: data.isHidden ? 'default' : 'pointer',
                    boxShadow: hoveredBarIndex === index ? '0 0 12px var(--accent-red)' : 'none'
                  }}
                ></div>

                {/* Date Label */}
                <div style={{ position: 'absolute', bottom: '-24px', left: '0', right: '0', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {data.shortDate}
                </div>
              </div>
            );
          })}

          {/* Interactive Floating Tooltip (Dynamic based on hovered bar index) */}
          {hoveredBarIndex !== null && (
            <div 
              style={{
                position: 'absolute',
                top: '40px',
                left: `${15 + (hoveredBarIndex * 12)}%`,
                backgroundColor: 'var(--card-bg)',
                border: '2px solid var(--accent-red)',
                borderRadius: '6px',
                padding: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                zIndex: 20,
                width: '210px',
                pointerEvents: 'none',
                transition: 'all 0.15s ease-out'
              }}
            >
              <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '8px', fontSize: '0.8rem' }}>
                {processedData[hoveredBarIndex].date}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Gross sales</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    {formatCurrency(processedData[hoveredBarIndex].sales)}
                  </span>
                </div>
                {compareActive && (
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)' }}>Prev sales</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                      {formatCurrency(processedData[hoveredBarIndex].compareSales)}
                    </span>
                  </div>
                )}
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Orders</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                    {processedData[hoveredBarIndex].orders}
                  </span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Covers</span>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {processedData[hoveredBarIndex].covers || '-'}
                  </span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>New unsettled amount</span>
                  <span style={{ color: 'var(--text-primary)' }}>-</span>
                </div>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>New unsettled orders</span>
                  <span style={{ color: 'var(--text-primary)' }}>-</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid for Bottom Charts (Totals breakdown) */}
      <div className="grid-2" style={{ gap: '20px', marginTop: '36px' }}>
        {/* Left: Day of week totals */}
        <div className="dashboard-card" style={{ position: 'relative' }}>
          <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Day of week totals</h3>
          <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
            {dayOfWeekData.map((data, index) => {
              const isVisible = selectedDays[data.fullName] !== false;
              const barHt = isVisible ? (data.sales / 1200) * 100 : 2;
              return (
                <div 
                  key={data.day} 
                  style={{ 
                    width: '10%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center', 
                    position: 'relative', 
                    opacity: isVisible ? 1 : 0.15,
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => isVisible && setHoveredDayIndex(index)}
                  onMouseLeave={() => setHoveredDayIndex(null)}
                  onClick={() => handleDayToggle(data.fullName)}
                >
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${barHt}%`, 
                      backgroundColor: hoveredDayIndex === index ? 'var(--accent-red)' : 'rgba(215, 25, 32, 0.55)', 
                      borderRadius: '2px 2px 0 0',
                      transition: 'all 0.15s ease',
                      boxShadow: hoveredDayIndex === index ? '0 0 10px var(--accent-red)' : 'none'
                    }}
                  ></div>
                  <span style={{ position: 'absolute', bottom: '-24px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{data.day}</span>
                </div>
              );
            })}
          </div>

          {/* Day of Week Hover Tooltip */}
          {hoveredDayIndex !== null && (
            <div 
              style={{
                position: 'absolute',
                top: '45px',
                left: `${10 + (hoveredDayIndex * 12)}%`,
                backgroundColor: 'var(--bg-card)',
                border: '2px solid var(--accent-red)',
                borderRadius: '6px',
                padding: '10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                zIndex: 20,
                width: '150px',
                pointerEvents: 'none',
                transition: 'all 0.15s ease-out'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                {dayOfWeekData[hoveredDayIndex].fullName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                Sales: {formatCurrency(dayOfWeekData[hoveredDayIndex].sales)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Time of day totals */}
        <div className="dashboard-card" style={{ position: 'relative' }}>
          <h3 className="card-title-text" style={{ marginBottom: '20px' }}>Time of day totals</h3>
          <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 10px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
            {timeOfDayData.map((data, index) => {
              const barHt = (data.sales / 1000) * 100;
              return (
                <div 
                  key={data.hour} 
                  style={{ 
                    width: '7%', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center', 
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredHourIndex(index)}
                  onMouseLeave={() => setHoveredHourIndex(null)}
                  onClick={() => alert(`Sales for ${data.hour}: ${formatCurrency(data.sales)}`)}
                >
                  <div 
                    style={{ 
                      width: '100%', 
                      height: `${barHt}%`, 
                      backgroundColor: hoveredHourIndex === index ? 'var(--accent-red)' : 'rgba(215, 25, 32, 0.55)', 
                      borderRadius: '2px 2px 0 0',
                      transition: 'all 0.15s ease',
                      boxShadow: hoveredHourIndex === index ? '0 0 10px var(--accent-red)' : 'none'
                    }}
                  ></div>
                  <span style={{ position: 'absolute', bottom: '-24px', fontSize: '0.6rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{data.hour}</span>
                </div>
              );
            })}
          </div>

          {/* Time of Day Hover Tooltip */}
          {hoveredHourIndex !== null && (
            <div 
              style={{
                position: 'absolute',
                top: '45px',
                left: `${1 + (hoveredHourIndex * 8.5)}%`,
                backgroundColor: 'var(--bg-card)',
                border: '2px solid var(--accent-red)',
                borderRadius: '6px',
                padding: '10px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.8)',
                zIndex: 20,
                width: '140px',
                pointerEvents: 'none',
                transition: 'all 0.15s ease-out'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-primary)' }}>
                Hour: {timeOfDayData[hoveredHourIndex].hour}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                Sales: {formatCurrency(timeOfDayData[hoveredHourIndex].sales)}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
