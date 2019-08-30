import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import axios from 'axios';
import Cascader, { CascaderProps } from '../../components/cascader';
import TextureConfig from './TextureConfig';
import { ItemDomainData, VrayTextureUI, VrayTexture } from './interface';
import { getDefaultConfigArr } from './utils';
import './FormTextureConfig.less';
import t from './i18n/index';

const prefixCls = 'mola-form-texture';
export interface ApiParams {
    /** 是否可以设置mix,污垢，有混合材质会开启 */
    showoption?: boolean;
    /** 材质编辑时会用到, 获取默认配置 */
    materialid?: string;
    version?: number;
}

export interface FormTextureConfigProps {
    /** 参考Cascader组件api */
    cascaderProps: CascaderProps;
    /** 有默认，一般不需要传递 */
    apiUrl?: string;
    apiParams?: ApiParams;
    /** 上传的材质贴图 */
    mainTexture?: string;
    /** 是否需要渲染预览图 */
    needRender?: boolean;
    /** 是否需要分组 */
    needGroup?: boolean;
    /** 是否显示参数指南，默认 false */
    needSettingGuide: boolean;
    className?: string;
    onChange: (params: VrayTexture) => void;
}

export interface FormTextureConfigState {
    visible: boolean;
    config: VrayTextureUI;
    ptextureId: string;
    currentParameters: ItemDomainData[];
    renderParams: VrayTexture;
    apiParams: ApiParams;
}

const DEFAULT_STATE = {
    visible: false,
    config: {
        parameters: [],
    },
    renderParams: {
        parameters: [],
    },
    ptextureId: '',
    currentParameters: [],
};

export default class TextureCate extends React.PureComponent<FormTextureConfigProps, FormTextureConfigState> {
    static propTypes = {
        needRender: PropTypes.bool,
        needSettingGuide: PropTypes.bool,
        mainTexture: PropTypes.string,
        apiConfig: PropTypes.object,
        className: PropTypes.string,
        onChange: PropTypes.func.isRequired
    };

    static defaultProps = {
        mainTexture: '',
        apiUrl: '/mg/api/materialinfowithdesc/ptexture',
        needGroup: true,
        needRender: true,
        needSettingGuide: true,
        apiParams: {
            showoption: true,
            version: 1, // 新版本 api
        }
    };

    constructor(props: FormTextureConfigProps) {
        super(props);
        this.state = {
            ...DEFAULT_STATE,
            apiParams: { ...TextureCate.defaultProps.apiParams, ...props.apiParams },
        };
    }

    // 处理显示的字段
    handleCascaderDisplay = (label: string[]) => {
        if (label.length === 0) {
            return '';
        }
        return label[label.length - 1];
    }

    handleChange = () => {
        const { config, ptextureId, currentParameters } = this.state;
        const value = {...config, ptextureId, parameters: currentParameters };
        this.setState({
            renderParams: value
        });
        this.props.onChange(value);
    }

    // 请求材质的高级配置
    handleCatChange = (value: string[]) => {
        const { cascaderProps } = this.props;
        const { apiParams } = this.state;
        // 重置
        if (value.length === 0 || !value) {
            this.setState({ ptextureId: '', visible: false });
            return;
        }
        this.setState({
            ptextureId: value[value.length - 1]
        });
        if (cascaderProps.onChange) {
            cascaderProps.onChange(value);
        }
        this.fetch(value[value.length - 1], {
            showoption: apiParams!.showoption,
            version: apiParams!.version,
        });
    }

    handleConfigChange = (value: ItemDomainData[]) => {
        this.setState({
            currentParameters: value
        }, () => {
            this.handleChange();
        });
    }

    handleToggle = () => {
        if (this.state.ptextureId) {
            this.setState({
                visible: !this.state.visible
            });
        }
    }

    componentWillMount() {
        const { cascaderProps: { defaultValue, value } } = this.props;
        const { apiParams } = this.state;
        const initValue = value || defaultValue;
        if (initValue && initValue.length > 0) {
            const ptextureId = initValue[initValue.length - 1];
            this.fetch(ptextureId, apiParams);
            this.setState({ ptextureId });
        }
    }

    componentWillReceiveProps(nextProps: FormTextureConfigProps, prevProps: FormTextureConfigProps) {
        const { cascaderProps: { value = [] } } = nextProps;
        const nextPtextureId = value.length > 0 ? value[value.length - 1] : '';
        if (nextPtextureId === '') {
            this.setState({
                ...DEFAULT_STATE,
            });
        }

        if (nextProps.apiParams !== prevProps.apiParams) {
            this.setState({
                apiParams: { ...TextureCate.defaultProps.apiParams, ...nextProps.apiParams },
            });
        }
    }

    fetch = (ptextureId: string, params: any) => {
        const { apiUrl, mainTexture } = this.props;
        return axios.get(`${apiUrl}/${ptextureId}`, { params })
        .then(({ data }) => {
            const r = typeof data === 'string' ? JSON.parse(data) : data;
            const { sharderName, parameters, mainTextureName } = r;
            this.setState({
                config: {
                    mainTexture,
                    sharderName,
                    parameters,
                    mainTextureName,
                    ptextureId
                },
                currentParameters: getDefaultConfigArr(r.parameters)
            }, () => {
                this.handleChange();
            });
        })
        .catch(e => {
            throw e;
        });
    }

    render() {
        const {
            cascaderProps,
            needRender,
            needSettingGuide,
            className,
            needGroup,
        } = this.props;
        const {
            visible,
            config,
            ptextureId,
            renderParams,
        } = this.state;

        const btnClass = classNames({
            [`${prefixCls}-btn`]: true,
            gray: !ptextureId
        });
        const tcClass = classNames({
            [`${prefixCls}-config-wp`]: true,
            hide: !visible
        });

        return (
            <div className={prefixCls}>
                <div className={`${prefixCls}-select-wp`}>
                    <Cascader
                        displayRender={this.handleCascaderDisplay}
                        expandTrigger="hover"
                        notFoundContent={t('没有材质分类')}
                        {...cascaderProps}
                        onChange={this.handleCatChange}
                    />
                    <span
                        className={btnClass}
                        onClick={this.handleToggle}
                    >
                        { !visible ? t('高级设置') : t('收起')}
                    </span>
                </div>
                <div className={tcClass}>
                    <TextureConfig
                        visible={visible}
                        parameters={config.parameters}
                        onChange={this.handleConfigChange}
                        renderParams={renderParams}
                        needRender={needRender!}
                        needSettingGuide={needSettingGuide}
                        className={className}
                        needGroup={needGroup!}
                    />
                </div>
            </div>
        );
    }
}
