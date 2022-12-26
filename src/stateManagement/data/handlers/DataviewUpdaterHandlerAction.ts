import { NoteInfoPage } from "cdm/DatabaseModel";
import { UpdaterData } from "cdm/EmitterModel";
import { TableColumn } from "cdm/FolderModel";
import { FilterSettings, LocalSettings } from "cdm/SettingsModel";
import { DataState, TableActionResponse } from "cdm/TableStateInterface";
import { DATAVIEW_UPDATER_OPERATIONS, MetadataColumns } from "helpers/Constants";
import tableFilter from "helpers/TableFiltersHelper";
import { DataviewService } from "services/DataviewService";
import { LOGGER } from "services/Logger";
import NoteInfo from "services/NoteInfo";
import { AbstractTableAction } from "stateManagement/AbstractTableAction";

export default class DataviewUpdaterHandlerAction extends AbstractTableAction<DataState> {
    handle(tableActionResponse: TableActionResponse<DataState>): TableActionResponse<DataState> {
        const { set, implementation, view } = tableActionResponse;
        implementation.actions.dataviewUpdater = async (
            updaterData: UpdaterData,
            columns: TableColumn[],
            ddbbConfig: LocalSettings,
            filterConfig: FilterSettings
        ) => {
            set((updater) => {
                const { rows } = updater;
                const { op, file, oldPath } = updaterData;

                const pathToOperate = oldPath ? oldPath : file.path;
                const indexToOperate = updater.rows.findIndex((row) => row.__note__.filepath === pathToOperate);
                const isFileInDDBB = indexToOperate !== -1;
                LOGGER.info(`DDBB "${view.file.basename}" Updater: ${op} ${pathToOperate} at index ${indexToOperate}`);
                let updatedRows = rows;
                switch (op) {
                    case DATAVIEW_UPDATER_OPERATIONS.DELETE:
                        if (isFileInDDBB) {
                            updatedRows = updatedRows.filter(
                                (r) => r.__note__.filepath !== pathToOperate
                            );
                        }
                        break;
                    case DATAVIEW_UPDATER_OPERATIONS.RENAME:
                        if (isFileInDDBB) {
                            const rowToRename = rows[indexToOperate];
                            rowToRename.__note__.filepath = file.path;
                            rowToRename[MetadataColumns.FILE] = DataviewService.getDataviewAPI().fileLink(file.path);
                            updatedRows = [...updater.rows.slice(0, indexToOperate), rowToRename, ...updater.rows.slice(indexToOperate + 1)];
                        }
                        break;
                    case DATAVIEW_UPDATER_OPERATIONS.UPDATE:
                        if (updaterData.isActive) {
                            LOGGER.info(`Refreshing File "${updaterData.file}" due to active file update. Ignore`);
                            return updater;
                        }

                        const updatedPage = DataviewService.getDataviewAPI().page(pathToOperate);
                        const isValid = !filterConfig.enabled ? true : tableFilter(filterConfig.conditions, updatedPage, ddbbConfig);
                        if (!isValid) {
                            LOGGER.info(`Refreshing File "${updaterData.file}" does not match filter. Ignore`);
                            return updater;
                        }
                        const noteInfo = new NoteInfo(updatedPage as NoteInfoPage);
                        const rowDataType = noteInfo.getRowDataType(columns);
                        if (isFileInDDBB) {
                            updatedRows = [...updater.rows.slice(0, indexToOperate), rowDataType, ...updater.rows.slice(indexToOperate + 1)];
                        } else {
                            updatedRows = [...updater.rows, rowDataType];
                        }

                        break;
                    default:
                    // Do nothing
                }

                return { rows: updatedRows }
            });
        }
        tableActionResponse.implementation = implementation;
        return this.goNext(tableActionResponse);
    }
}