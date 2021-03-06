/* Greenbone Security Assistant
 *
 * Authors:
 * Björn Ricks <bjoern.ricks@greenbone.net>
 *
 * Copyright:
 * Copyright (C) 2017 Greenbone Networks GmbH
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import React from 'react';

import moment from 'moment-timezone';

import _ from 'gmp/locale.js';
import logger from 'gmp/log.js';
import {
  first,
  for_each,
  includes_id,
  is_array,
  is_defined,
  map,
  select_save_id,
} from 'gmp/utils.js';

import {
  FULL_AND_FAST_SCAN_CONFIG_ID,
  OPENVAS_SCAN_CONFIG_TYPE,
  OSP_SCAN_CONFIG_TYPE,
} from 'gmp/models/scanconfig.js';

import {
  OPENVAS_DEFAULT_SCANNER_ID,
} from 'gmp/models/scanner.js';

import PropTypes from '../../utils/proptypes.js';

import Wrapper from '../../components/layout/wrapper.js';

import EntityComponent from '../../entity/component.js';

import ImportReportDialog from '../reports/importdialog.js';

import AdvancedTaskWizard from '../../wizard/advancedtaskwizard.js';
import ModifyTaskWizard from '../../wizard/modifytaskwizard.js';
import TaskWizard from '../../wizard/taskwizard.js';

import TaskDialog from './dialogcontainer.js';
import ContainerTaskDialog from './containerdialog.js';

const log = logger.getLogger('web.tasks.component');

const sort_scan_configs = scan_configs => {
  const sorted_scan_configs = {
    [OPENVAS_SCAN_CONFIG_TYPE]: [],
    [OSP_SCAN_CONFIG_TYPE]: [],
  };

  for_each(scan_configs, config => {
    const type = config.scan_config_type;
    if (!is_array(sorted_scan_configs[type])) {
      sorted_scan_configs[type] = [];
    }
    sorted_scan_configs[type].push(config);
  });
  return sorted_scan_configs;
};

class TaskComponent extends React.Component {

  constructor(...args) {
    super(...args);

    const {gmp} = this.context;

    this.cmd = gmp.task;

    this.handleReportImport = this.handleReportImport.bind(this);
    this.handleTaskResume = this.handleTaskResume.bind(this);
    this.handleSaveAdvancedTaskWizard =
      this.handleSaveAdvancedTaskWizard.bind(this);
    this.handleSaveContainerTask = this.handleSaveContainerTask.bind(this);
    this.handleSaveModifyTaskWizard =
      this.handleSaveModifyTaskWizard.bind(this);
    this.handleSaveTaskWizard = this.handleSaveTaskWizard.bind(this);
    this.handleTaskStart = this.handleTaskStart.bind(this);
    this.handleTaskStop = this.handleTaskStop.bind(this);
    this.handleTaskWizardNewClick = this.handleTaskWizardNewClick.bind(this);

    this.openAdvancedTaskWizard = this.openAdvancedTaskWizard.bind(this);
    this.openContainerTaskDialog = this.openContainerTaskDialog.bind(this);
    this.openReportImportDialog = this.openReportImportDialog.bind(this);
    this.openModifyTaskWizard = this.openModifyTaskWizard.bind(this);
    this.openStandardTaskDialog = this.openStandardTaskDialog.bind(this);
    this.openTaskDialog = this.openTaskDialog.bind(this);
    this.openTaskWizard = this.openTaskWizard.bind(this);
  }

  handleSaveContainerTask(data) {
    if (is_defined(data.id)) {
      const {onContainerSaved, onContainerSaveError} = this.props;
      return this.cmd.saveContainer(data).then(onContainerSaved,
        onContainerSaveError);
    }

    const {onContainerCreated, onContainerCreateError} = this.props;
    return this.cmd.createContainer(data).then(onContainerCreated,
      onContainerCreateError);
  }

  handleReportImport(data) {
    const {gmp} = this.context;
    const {onReportImported, onReportImportError} = this.props;

    return gmp.report.import(data).then(onReportImported, onReportImportError);
  }

  handleTaskStart(task) {
    const {onStarted, onStartError} = this.props;

    return this.cmd.start(task).then(onStarted, onStartError);
  }

  handleTaskStop(task) {
    const {onStopped, onStopError} = this.props;

    return this.cmd.stop(task).then(onStopped, onStopError);
  }

  handleTaskResume(task) {
    const {onResumed, onResumeError} = this.props;

    return this.cmd.resume(task).then(onResumed, onResumeError);
  }

  handleSaveTaskWizard(data) {
    const {gmp} = this.context;
    const {onTaskWizardSaved, onTaskWizardError} = this.props;

    return gmp.wizard.runQuickFirstScan(data).then(onTaskWizardSaved,
      onTaskWizardError);
  }

  handleSaveAdvancedTaskWizard(data) {
    const {gmp} = this.context;
    const {onAdvancedTaskWizardSaved, onAdvancedTaskWizardError} = this.props;

    return gmp.wizard.runQuickTask(data).then(onAdvancedTaskWizardSaved,
      onAdvancedTaskWizardError);
  }

  handleSaveModifyTaskWizard(data) {
    const {gmp} = this.context;
    const {onModifyTaskWizardSaved, onModifyTaskWizardError} = this.props;

    return gmp.wizard.runModifyTask(data).then(onModifyTaskWizardSaved,
      onModifyTaskWizardError);
  }

  handleTaskWizardNewClick() {
    this.openTaskDialog();
    this.task_wizard.close();
  }

  openContainerTaskDialog(task) {
    this.container_dialog.show({
      task,
      name: task ? task.name : _('unnamed'),
      comment: task ? task.comment : '',
      id: task ? task.id : undefined,
      in_assets: task ? task.in_assets : undefined,
      auto_delete: task ? task.auto_delete : undefined,
      auto_delete_data: task ? task.auto_delete_data : undefined,
    }, {
      title: task ? _('Edit Container Task {{name}}', task) :
        _('New Container Task'),
    });
  }

  openTaskDialog(task) {
    if (is_defined(task) && task.isContainer()) {
      this.openContainerTaskDialog(task);
    }
    else {
      this.openStandardTaskDialog(task);
    }
  }

  openStandardTaskDialog(task) {
    const {capabilities, gmp} = this.context;

    if (task) {
      gmp.task.editTaskSettings(task).then(response => {
        const settings = response.data;
        const {targets, scan_configs, alerts, scanners, schedules} = settings;

        log.debug('Loaded edit task dialog settings', settings);

        const sorted_scan_configs = sort_scan_configs(scan_configs);

        let schedule_id;
        if (capabilities.mayAccess('schedules') &&
          is_defined(task.schedule)) {
          schedule_id = task.schedule.id;
        }
        else {
          schedule_id = 0;
        }

        this.task_dialog.show({
          alert_ids: map(task.alerts, alert => alert.id),
          alerts,
          alterable: task.alterable,
          apply_overrides: task.apply_overrides,
          auto_delete: task.auto_delete,
          auto_delete_data: task.auto_delete_data,
          comment: task.comment,
          config_id: task.isChangeable() ? task.config.id : '0',
          id: task.id,
          in_assets: task.in_assets,
          min_qod: task.min_qod,
          name: task.name,
          scan_configs: sorted_scan_configs,
          scanner_id: task.isChangeable() ? task.scanner.id : '0',
          scanner_type: task.scanner.scanner_type,
          scanners,
          schedule_id,
          schedules,
          target_id: task.isChangeable() ? task.target.id : '0',
          targets,
          task: task,
        }, {
          title: _('Edit Task {{name}}', task),
        });
      });
    }
    else {
      gmp.task.newTaskSettings().then(response => {
        const settings = response.data;
        let {
          schedule_id,
          alert_id,
          target_id,
          targets,
          scanner_id = OPENVAS_DEFAULT_SCANNER_ID,
          scan_configs,
          config_id = FULL_AND_FAST_SCAN_CONFIG_ID,
          alerts, scanners,
          schedules,
          tags,
        } = settings;

        log.debug('Loaded new task dialog settings', settings);

        const sorted_scan_configs = sort_scan_configs(scan_configs);

        scanner_id = select_save_id(scanners, scanner_id);

        target_id = select_save_id(targets, target_id);

        schedule_id = select_save_id(schedules, schedule_id, '0');

        alert_id = includes_id(alerts, alert_id) ? alert_id : undefined;

        const alert_ids = is_defined(alert_id) ? [alert_id] : [];

        this.task_dialog.show({
          alert_ids,
          alerts,
          config_id,
          scanners,
          scanner_id,
          scan_configs: sorted_scan_configs,
          schedule_id,
          schedules,
          tag_name: first(tags).name,
          tags,
          target_id,
          targets,
        }, {
          title: _('New Task'),
        });
      });
    }
  }

  openReportImportDialog(task) {
    this.import_report_dialog.show({
      task_id: task.id,
      tasks: [task],
    });
  }

  openTaskWizard() {
    const {gmp} = this.context;

    this.task_wizard.show({});

    gmp.wizard.task().then(response => {
      const settings = response.data;
      this.task_wizard.setValues({
        hosts: settings.client_address,
        port_list_id: settings.get('Default Port List').value,
        alert_id: settings.get('Default Alert').value,
        config_id: settings.get('Default OpenVAS Scan Config').value,
        ssh_credential: settings.get('Default SSH Credential').value,
        smb_credential: settings.get('Default SMB Credential').value,
        esxi_credential: settings.get('Default ESXi Credential').value,
        scanner_id: settings.get('Default OpenVAS Scanner').value,
      });
    });
  }

  openAdvancedTaskWizard() {
    const {gmp} = this.context;

    gmp.wizard.advancedTask().then(response => {
      const settings = response.data;
      let config_id = settings.get('Default OpenVAS Scan Config').value;

      if (!is_defined(config_id) || config_id.length === 0) {
        config_id = FULL_AND_FAST_SCAN_CONFIG_ID;
      }

      const {credentials} = settings;

      const ssh_credential = select_save_id(credentials,
        settings.get('Default SSH Credential').value, '');
      const smb_credential = select_save_id(credentials,
        settings.get('Default SMB Credential').value, '');
      const esxi_credential = select_save_id(credentials,
        settings.get('Default ESXi Credential').value, '');

      const now = moment().tz(settings.timezone);

      this.advanced_task_wizard.show({
        credentials,
        scan_configs: settings.scan_configs,
        date: now,
        task_name: _('New Quick Task'),
        target_hosts: settings.client_address,
        port_list_id: settings.get('Default Port List').value,
        alert_id: settings.get('Default Alert').value,
        config_id,
        ssh_credential,
        smb_credential,
        esxi_credential,
        scanner_id: settings.get('Default OpenVAS Scanner').value,
        slave_id: settings.get('Default Slave').value,
        start_minute: now.minutes(),
        start_hour: now.hours(),
        start_timezone: settings.timezone,
      });
    });
  }

  openModifyTaskWizard() {
    const {gmp} = this.context;

    gmp.wizard.modifyTask().then(response => {
      const settings = response.data;
      const now = moment().tz(settings.timezone);

      this.modify_task_wizard.show({
        date: now,
        tasks: settings.tasks,
        reschedule: '0',
        task_id: select_save_id(settings.tasks),
        start_minute: now.minutes(),
        start_hour: now.hours(),
        start_timezone: settings.timezone,
      });
    });
  }

  render() {
    const {
      children,
      onCloned,
      onCloneError,
      onCreated,
      onCreateError,
      onDeleted,
      onDeleteError,
      onDownloaded,
      onDownloadError,
      onSaved,
      onSaveError,
    } = this.props;
    return (
      <Wrapper>
        <EntityComponent
          name="task"
          onCreated={onCreated}
          onCreateError={onCreateError}
          onCloned={onCloned}
          onCloneError={onCloneError}
          onDeleted={onDeleted}
          onDeleteError={onDeleteError}
          onDownloaded={onDownloaded}
          onDownloadError={onDownloadError}
          onSaved={onSaved}
          onSaveError={onSaveError}
        >
          {({
            save,
            ...other
          }) => (
            <Wrapper>
              {children({
                ...other,
                create: this.openTaskDialog,
                createcontainer: this.openContainerTaskDialog,
                edit: this.openTaskDialog,
                start: this.handleTaskStart,
                stop: this.handleTaskStop,
                resume: this.handleTaskResume,
                reportimport: this.openReportImportDialog,
                advancedtaskwizard: this.openAdvancedTaskWizard,
                modifytaskwizard: this.openModifyTaskWizard,
                taskwizard: this.openTaskWizard,
              })}
              <TaskDialog
                ref={ref => this.task_dialog = ref}
                onSave={save}
              />
            </Wrapper>
          )}
        </EntityComponent>

        <ContainerTaskDialog
          ref={ref => this.container_dialog = ref}
          onSave={this.handleSaveContainerTask}/>

        <TaskWizard
          ref={ref => this.task_wizard = ref}
          onSave={this.handleSaveTaskWizard}
          onNewClick={this.handleTaskWizardNewClick}/>
        <AdvancedTaskWizard
          ref={ref => this.advanced_task_wizard = ref}
          onSave={this.handleSaveAdvancedTaskWizard}/>
        <ModifyTaskWizard
          ref={ref => this.modify_task_wizard = ref}
          onSave={this.handleSaveModifyTaskWizard}/>

        <ImportReportDialog
          ref={ref => this.import_report_dialog = ref}
          newContainerTask={false}
          onSave={this.handleReportImport}/>
      </Wrapper>
    );
  }
}

TaskComponent.propTypes = {
  children: PropTypes.func.isRequired,
  onAdvancedTaskWizardError: PropTypes.func,
  onAdvancedTaskWizardSaved: PropTypes.func,
  onCloneError: PropTypes.func,
  onCloned: PropTypes.func,
  onContainerCreateError: PropTypes.func,
  onContainerCreated: PropTypes.func,
  onContainerSaveError: PropTypes.func,
  onContainerSaved: PropTypes.func,
  onCreateError: PropTypes.func,
  onCreated: PropTypes.func,
  onDeleteError: PropTypes.func,
  onDeleted: PropTypes.func,
  onDownloadError: PropTypes.func,
  onDownloaded: PropTypes.func,
  onModifyTaskWizardError: PropTypes.func,
  onModifyTaskWizardSaved: PropTypes.func,
  onReportImportError: PropTypes.func,
  onReportImported: PropTypes.func,
  onResumeError: PropTypes.func,
  onResumed: PropTypes.func,
  onSaveError: PropTypes.func,
  onSaved: PropTypes.func,
  onStartError: PropTypes.func,
  onStarted: PropTypes.func,
  onStopError: PropTypes.func,
  onStopped: PropTypes.func,
  onTaskWizardError: PropTypes.func,
  onTaskWizardSaved: PropTypes.func,
};

TaskComponent.contextTypes = {
  gmp: PropTypes.gmp.isRequired,
  capabilities: PropTypes.capabilities.isRequired,
};

export default TaskComponent;
