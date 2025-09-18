import { useMemo, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Empty, Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { ListTable, themes } from '@visactor/vtable';
import { exportVTableToCsv, exportVTableToExcel } from '@visactor/vtable-export';
import { Buffer } from 'buffer';
import { vsTheme, writeToClipboardAsync } from "../../../stores/homeSlice";

import { sqlResult, executeSqlStatus, exportToSaveAsync } from '../../../stores/sqlSlice';

import { getVScodeColor } from '../../../utils';


function getBackgroundColor(args) {
  const { row, table } = args;
  const index = row - table.frozenRowCount;
  if (!(index & 1)) {
    return getVScodeColor('--vscode-editorWidget-background')||'#252526';
  }
  return getVScodeColor('--x-thead-background')||'#1e1e1e';
}

const getThemes = (theme) => {
  if(theme === 'dark') {
    const hoverBgColor = getVScodeColor('--vscode-list-hoverBackground')||'#2a2d2e';
    return themes.DARK.extends({
      defaultStyle: {
        hover: {
          cellBgColor: hoverBgColor
        }
      },
      frameStyle: {
        // borderColor: '#000000',
        cornerRadius: 0,
        borderLineWidth: 0,
        shadowBlur: 0
      },
      bodyStyle: {
        bgColor: getBackgroundColor,
        hover: {
          cellBgColor: hoverBgColor,
          inlineRowBgColor: hoverBgColor,
          inlineColumnBgColor: hoverBgColor
        },
      },
      headerStyle: {
        bgColor: getVScodeColor('--x-thead-background')||'#1e1e1e',
        hover: {
          cellBgColor: hoverBgColor,
          inlineRowBgColor: hoverBgColor,
        },
      },
    })
  }
  return themes.DEFAULT.extends({
      frameStyle: {
        cornerRadius: 0,
        borderLineWidth: 0,
      },
      headerStyle: {
        bgColor: getVScodeColor('--x-thead-background')||'#f3f3f3'
      }
    })
}

const LoadingComponent = () => (
  <div  style={{ height: '100%', width: '100%', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
    <Spin size='large'/>
  </div>
);
const EmptyComponent = () => (
  <div  style={{ height: '100%', width: '100%', top: 0, left: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}/>
  </div>
);

const QueryResult = forwardRef((props, ref) => {
  const dispatch = useDispatch();
  const iSqlResult = useSelector(sqlResult);
  const iVsTheme = useSelector(vsTheme);
  const tableRef = useRef();
  const tableInstance = useRef();
  const iExecuteSqlStatus = useSelector(executeSqlStatus);
  const getColums = (data)=>{
    if (!data || !data.length) return [];

    return Object.keys(data[0]).map(key => ({
      title: key,
      field: key,
      key: key,
      width: 'auto'
    }));
  }
  const getTableOptions = ()=>{
    return {
      theme: getThemes(iVsTheme),
      hover:{
        highlightMode: 'cross'
      },
      keyboardOptions: {
        copySelected: true,
      },
      menu: {
        contextMenuItems: ['Copy']
      },
      showFrozenIcon: true,
    }
  }
  useEffect(()=>{
    const tableOptions = getTableOptions();
    tableInstance.current = new ListTable(tableRef.current, tableOptions);
    let copyData;
    tableInstance.current.on('dropdown_menu_click', args => {
      // console.log('dropdown_menu_click', args);
      if (args.menuKey === 'Copy') {
        copyData = tableInstance.current.getCopyValue();
        // console.log('copyData:', copyData);
        dispatch(writeToClipboardAsync({ content: copyData }));
      }
    })
  }, [])
  useEffect(() => {
    if (iSqlResult) {
      const iColums = getColums(iSqlResult)
      // const tbOptions = { ...getTableOptions(), allowFrozenColCount: iColums.length>10?3:0 };
      // tableInstance.current.updateOption(tbOptions);
      tableInstance.current.updateColumns(iColums);
      tableInstance.current.setRecords(iSqlResult);
      tableInstance.current.clearSelected();
    }
  }, [iSqlResult]);

  useEffect(() => {
    tableInstance.current.updateTheme(getThemes(iVsTheme));
  }, [iVsTheme]);

  const tableDisplay = useMemo(() => {
    return iExecuteSqlStatus === 'loading'||(!iSqlResult||iSqlResult.length===0) ? 'none' : 'block';
  }, [iExecuteSqlStatus, iSqlResult]);

  const loadingDisplay = useMemo(() => {
    return iExecuteSqlStatus === 'loading';
  }, [iExecuteSqlStatus]);

  const emptyDisplay = useMemo(() => {
    return (iExecuteSqlStatus !== 'loading')&&(!iSqlResult||iSqlResult.length===0);
  }, [iExecuteSqlStatus, iSqlResult]);

  useImperativeHandle(ref, () => ({
    table: tableInstance.current,
    exportToExcel: async () => {
      if(!iSqlResult||iSqlResult.length===0) {
        return
      }
      if (tableInstance.current) {
        const exceldata = await exportVTableToExcel(tableInstance.current, { exportAllData: true });
        const fileStr = Buffer.from(exceldata).toString('base64');
        dispatch(exportToSaveAsync({ fileStr: fileStr, fileType: 'excel' }));
      }
    },
    exportToCsv: async () => {
      console.log('iSqlResult:', iSqlResult)
      if(!iSqlResult||iSqlResult.length===0) {
        return
      }
      if (tableInstance.current) {
        const csvdata = await exportVTableToCsv(tableInstance.current, { exportAllData: true });
        dispatch(exportToSaveAsync({ fileStr: csvdata, fileType: 'csv' }));
      }
    }
  }));

  return (
    <div  style={{ height: '100%', width: '100%' }}>
      { loadingDisplay?<LoadingComponent /> : null }
      { emptyDisplay?<EmptyComponent /> : null }
      <div style={{ width: '100%', height: '100%', display: tableDisplay }} ref={tableRef}>
      </div>
    </div>
  );
});

export default QueryResult;
