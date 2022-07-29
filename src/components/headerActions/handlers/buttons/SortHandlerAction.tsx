import { HeaderActionResponse } from "cdm/HeaderActionModel";
import { AbstractHeaderAction } from "components/headerActions/handlers/AbstractHeaderAction";
import CrossIcon from "components/img/CrossIcon";
import ArrowUpIcon from "components/img/ArrowUp";
import ArrowDownIcon from "components/img/ArrowDown";
import React from "react";
import { ActionTypes, InputType } from "helpers/Constants";
import { TableColumn } from "cdm/FolderModel";

export default class SortHandlerAction extends AbstractHeaderAction {
  globalHeaderActionResponse: HeaderActionResponse;
  handle(headerActionResponse: HeaderActionResponse): HeaderActionResponse {
    this.globalHeaderActionResponse = headerActionResponse;
    const column = this.globalHeaderActionResponse.headerMenuProps.headerProps
      .column.columnDef as TableColumn;
    switch (column.input) {
      case InputType.TAGS:
      case InputType.TASK:
        // DO NOTHING
        break;
      default:
        this.addSortButtons();
    }
    return this.goNext(this.globalHeaderActionResponse);
  }

  /**
   * add sort buttons to the column header. Global header action response is updated.
   */
  private addSortButtons(): void {
    const { hooks } = this.globalHeaderActionResponse;
    const { table, header, column } =
      this.globalHeaderActionResponse.headerMenuProps.headerProps;

    const tablecolumn = column.columnDef as TableColumn;
    const sortButtons: any[] = [];
    sortButtons.push(
      {
        onClick: (e: any) => {
          const sortArray =
            table.options.meta.tableState.sorting.generateSorting(
              tablecolumn,
              false
            );
          tablecolumn.isSorted =
            tablecolumn.isSorted && !tablecolumn.isSortedDesc ? false : true;
          tablecolumn.isSortedDesc = false;
          hooks.setExpanded(false);
          // Update state
          table.options.meta.tableState.columns.alterSorting(tablecolumn);
          table.options.meta.tableState.initialState.alterSortBy(sortArray);
          table.setSorting(sortArray);
        },
        icon:
          header.column.getIsSorted() === "asc" ? (
            <CrossIcon />
          ) : (
            <ArrowUpIcon />
          ),
        label:
          header.column.getIsSorted() === "asc"
            ? "Remove ascending sort"
            : "Sort ascending",
      },
      {
        onClick: (e: any) => {
          const sortArray =
            table.options.meta.tableState.sorting.generateSorting(
              tablecolumn,
              true
            );
          tablecolumn.isSorted =
            tablecolumn.isSorted && tablecolumn.isSortedDesc ? false : true;
          tablecolumn.isSortedDesc = true;

          hooks.setExpanded(false);
          // Update state
          table.options.meta.tableState.columns.alterSorting(tablecolumn);
          table.options.meta.tableState.initialState.alterSortBy(sortArray);
          table.setSorting(sortArray);
        },
        icon:
          header.column.getIsSorted() === "desc" ? (
            <CrossIcon />
          ) : (
            <ArrowDownIcon />
          ),
        label:
          header.column.getIsSorted() === "desc"
            ? "Remove descending sort"
            : "Sort descending",
      }
    );
    this.globalHeaderActionResponse.buttons.push(...sortButtons);
  }
}
